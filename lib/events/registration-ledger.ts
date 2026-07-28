/**
 * Portal registration ledger — durable pretix order records scoped by portal slug.
 * pretix remains SoT for payments/tickets; EA mirrors enough for My registrations + reminders.
 */
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export type RegistrationPaymentStatus = 'placed' | 'paid' | 'canceled' | 'unknown';

export type PortalEventRegistration = {
  id: string;
  portalSlug: string;
  organizationId?: string;
  orderCode: string;
  email?: string;
  eventTitle: string;
  pretixEventSlug?: string;
  pretixOrganizerSlug?: string;
  shopUrl?: string;
  eventStartsAt?: string;
  status: RegistrationPaymentStatus;
  placedAt: string;
  paidAt?: string;
  updatedAt: string;
  /** Reminder markers: t7 | t1 | tday ISO timestamps when sent */
  remindersSent?: Partial<Record<'t7' | 't1' | 'tday', string>>;
};

type StoreData = {
  version: number;
  updatedAt: string;
  registrations: PortalEventRegistration[];
};

const STORE_FILE_NAME = 'portal-event-registrations.json';
const STORE_FILE = process.env.VERCEL
  ? path.join(os.tmpdir(), STORE_FILE_NAME)
  : path.join(/* turbopackIgnore: true */ process.cwd(), '.data', STORE_FILE_NAME);

const MEMORY_CAP = 500;
let memoryStore: StoreData = { version: 1, updatedAt: '', registrations: [] };

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `reg_${Date.now().toString(36)}_${randomBytes(3).toString('hex')}`;
}

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

async function readStore(): Promise<StoreData> {
  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as StoreData;
    if (parsed && Array.isArray(parsed.registrations)) {
      memoryStore = parsed;
      return parsed;
    }
  } catch {
    // fall through
  }
  return memoryStore;
}

async function writeStore(store: StoreData): Promise<void> {
  memoryStore = store;
  try {
    await mkdir(path.dirname(STORE_FILE), { recursive: true });
    await writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch {
    // Vercel / read-only FS — memory remains source of truth for this instance.
  }
}

export async function listRegistrationsForPortal(
  portalSlug: string,
  opts?: { email?: string },
): Promise<PortalEventRegistration[]> {
  const store = await readStore();
  const slug = normalizeSlug(portalSlug);
  const email = opts?.email?.trim().toLowerCase();
  return store.registrations
    .filter((row) => row.portalSlug === slug)
    .filter((row) => (email ? (row.email || '').toLowerCase() === email : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listAllRegistrations(): Promise<PortalEventRegistration[]> {
  const store = await readStore();
  return [...store.registrations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function upsertRegistrationFromPretix(input: {
  portalSlug: string;
  organizationId?: string;
  orderCode: string;
  email?: string;
  eventTitle: string;
  pretixEventSlug?: string;
  pretixOrganizerSlug?: string;
  shopUrl?: string;
  eventStartsAt?: string;
  status: RegistrationPaymentStatus;
}): Promise<PortalEventRegistration> {
  const store = await readStore();
  const portalSlug = normalizeSlug(input.portalSlug);
  const orderCode = input.orderCode.trim() || 'unknown';
  const stamped = nowIso();
  const existingIndex = store.registrations.findIndex(
    (row) =>
      row.portalSlug === portalSlug &&
      row.orderCode === orderCode &&
      (input.pretixEventSlug ? row.pretixEventSlug === input.pretixEventSlug : true),
  );

  if (existingIndex >= 0) {
    const prev = store.registrations[existingIndex];
    const next: PortalEventRegistration = {
      ...prev,
      email: input.email?.trim() || prev.email,
      eventTitle: input.eventTitle || prev.eventTitle,
      pretixEventSlug: input.pretixEventSlug || prev.pretixEventSlug,
      pretixOrganizerSlug: input.pretixOrganizerSlug || prev.pretixOrganizerSlug,
      shopUrl: input.shopUrl || prev.shopUrl,
      eventStartsAt: input.eventStartsAt || prev.eventStartsAt,
      organizationId: input.organizationId || prev.organizationId,
      status: input.status === 'unknown' ? prev.status : input.status,
      paidAt: input.status === 'paid' ? stamped : prev.paidAt,
      updatedAt: stamped,
    };
    const registrations = [...store.registrations];
    registrations[existingIndex] = next;
    await writeStore({ version: store.version, updatedAt: stamped, registrations });
    return next;
  }

  const created: PortalEventRegistration = {
    id: newId(),
    portalSlug,
    organizationId: input.organizationId,
    orderCode,
    email: input.email?.trim() || undefined,
    eventTitle: input.eventTitle,
    pretixEventSlug: input.pretixEventSlug,
    pretixOrganizerSlug: input.pretixOrganizerSlug,
    shopUrl: input.shopUrl,
    eventStartsAt: input.eventStartsAt,
    status: input.status,
    placedAt: stamped,
    paidAt: input.status === 'paid' ? stamped : undefined,
    updatedAt: stamped,
    remindersSent: {},
  };

  await writeStore({
    version: store.version,
    updatedAt: stamped,
    registrations: [created, ...store.registrations].slice(0, MEMORY_CAP),
  });
  return created;
}

export async function markRegistrationReminderSent(
  id: string,
  kind: 't7' | 't1' | 'tday',
): Promise<PortalEventRegistration | null> {
  const store = await readStore();
  const index = store.registrations.findIndex((row) => row.id === id);
  if (index < 0) return null;
  const stamped = nowIso();
  const prev = store.registrations[index];
  const next: PortalEventRegistration = {
    ...prev,
    remindersSent: { ...(prev.remindersSent || {}), [kind]: stamped },
    updatedAt: stamped,
  };
  const registrations = [...store.registrations];
  registrations[index] = next;
  await writeStore({ version: store.version, updatedAt: stamped, registrations });
  return next;
}

/** Test helper — replace in-memory store (also writes when FS available). */
export async function replaceRegistrationStoreForTests(
  registrations: PortalEventRegistration[],
): Promise<void> {
  await writeStore({
    version: 1,
    updatedAt: nowIso(),
    registrations,
  });
}
