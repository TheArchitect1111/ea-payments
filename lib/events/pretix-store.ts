import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  isValidPretixShopUrl,
  type PortalPretixEvent,
  type PortalPretixEventStatus,
  type PretixIntegrationConfig,
} from '@/lib/events/pretix-types';

type StoreData = {
  version: number;
  updatedAt: string;
  events: PortalPretixEvent[];
};

const STORE_FILE_NAME = 'portal-pretix-events.json';
const STORE_FILE = process.env.VERCEL
  ? path.join(os.tmpdir(), STORE_FILE_NAME)
  : path.join(/* turbopackIgnore: true */ process.cwd(), '.data', STORE_FILE_NAME);

const MEMORY_CAP = 200;
let memoryStore: StoreData = { version: 1, updatedAt: '', events: [] };

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `px_${Date.now().toString(36)}_${randomBytes(3).toString('hex')}`;
}

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

function parseEnvSeed(): PortalPretixEvent[] {
  const raw = process.env.PRETIX_EVENTS_JSON?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Array<Partial<PortalPretixEvent>>;
    if (!Array.isArray(parsed)) return [];
    const stamped = nowIso();
    const events: PortalPretixEvent[] = [];
    parsed.forEach((row, index) => {
      const portalSlug = normalizeSlug(String(row.portalSlug || ''));
      const shopUrl = String(row.shopUrl || '').trim();
      const title = String(row.title || '').trim();
      if (!portalSlug || !title || !isValidPretixShopUrl(shopUrl)) return;
      events.push({
        id: String(row.id || `px_env_${index}`),
        portalSlug,
        title,
        summary: String(
          row.summary || 'Register and pay securely — confirmations come from your event shop.',
        ).trim(),
        shopUrl,
        pretixEventSlug: row.pretixEventSlug?.trim() || undefined,
        pretixOrganizerSlug: row.pretixOrganizerSlug?.trim() || undefined,
        startsAt: row.startsAt?.trim() || undefined,
        endsAt: row.endsAt?.trim() || undefined,
        location: row.location?.trim() || undefined,
        status: (row.status as PortalPretixEventStatus) || 'published',
        createdAt: row.createdAt || stamped,
        updatedAt: row.updatedAt || stamped,
        createdBy: row.createdBy || 'env',
      });
    });
    return events;
  } catch {
    return [];
  }
}

async function readStore(): Promise<StoreData> {
  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as StoreData;
    if (parsed && Array.isArray(parsed.events)) {
      memoryStore = parsed;
      return parsed;
    }
  } catch {
    // fall through
  }
  const seeded = parseEnvSeed();
  if (seeded.length && memoryStore.events.length === 0) {
    memoryStore = { version: 1, updatedAt: nowIso(), events: seeded };
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

export function getPretixIntegrationConfig(eventCount: number): PretixIntegrationConfig {
  return {
    configured: eventCount > 0,
    webhookSecretConfigured: Boolean(process.env.PRETIX_WEBHOOK_SECRET?.trim()),
    eventCount,
    docs: 'docs/integrations/PRETIX-EVENT-ENGINE.md',
  };
}

export async function listPretixEventsForPortal(
  portalSlug: string,
  opts?: { includeDrafts?: boolean },
): Promise<PortalPretixEvent[]> {
  const store = await readStore();
  const slug = normalizeSlug(portalSlug);
  return store.events
    .filter((event) => event.portalSlug === slug)
    .filter((event) => (opts?.includeDrafts ? true : event.status === 'published'))
    .sort((a, b) => (b.startsAt || b.updatedAt).localeCompare(a.startsAt || a.updatedAt));
}

export async function listAllPretixEvents(): Promise<PortalPretixEvent[]> {
  const store = await readStore();
  return [...store.events].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function findPretixEventByShopOrSlug(input: {
  shopUrl?: string;
  pretixEventSlug?: string;
  portalSlug?: string;
}): Promise<PortalPretixEvent | null> {
  const store = await readStore();
  const shop = input.shopUrl?.trim();
  const eventSlug = input.pretixEventSlug?.trim().toLowerCase();
  const portalSlug = input.portalSlug ? normalizeSlug(input.portalSlug) : undefined;

  return (
    store.events.find((event) => {
      if (portalSlug && event.portalSlug !== portalSlug) return false;
      if (shop && event.shopUrl.replace(/\/$/, '') === shop.replace(/\/$/, '')) return true;
      if (eventSlug && event.pretixEventSlug?.toLowerCase() === eventSlug) return true;
      return false;
    }) ?? null
  );
}

export async function createPretixEvent(input: {
  portalSlug: string;
  title: string;
  summary?: string;
  shopUrl: string;
  pretixEventSlug?: string;
  pretixOrganizerSlug?: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
  status?: PortalPretixEventStatus;
  createdBy?: string;
}): Promise<{ ok: true; event: PortalPretixEvent } | { ok: false; error: string }> {
  const portalSlug = normalizeSlug(input.portalSlug);
  const title = input.title.trim();
  const shopUrl = input.shopUrl.trim();
  if (!portalSlug) return { ok: false, error: 'Portal slug is required.' };
  if (!title) return { ok: false, error: 'Title is required.' };
  if (!isValidPretixShopUrl(shopUrl)) {
    return { ok: false, error: 'Shop URL must be an https pretix event link with a path.' };
  }

  const stamped = nowIso();
  const event: PortalPretixEvent = {
    id: newId(),
    portalSlug,
    title,
    summary:
      input.summary?.trim() ||
      'Register and pay securely. Pretix sends your confirmation — Amplifi/EA never auto-posts.',
    shopUrl,
    pretixEventSlug: input.pretixEventSlug?.trim() || undefined,
    pretixOrganizerSlug: input.pretixOrganizerSlug?.trim() || undefined,
    startsAt: input.startsAt?.trim() || undefined,
    endsAt: input.endsAt?.trim() || undefined,
    location: input.location?.trim() || undefined,
    status: input.status || 'published',
    createdAt: stamped,
    updatedAt: stamped,
    createdBy: input.createdBy,
  };

  const store = await readStore();
  const next: StoreData = {
    version: store.version,
    updatedAt: stamped,
    events: [event, ...store.events].slice(0, MEMORY_CAP),
  };
  await writeStore(next);
  return { ok: true, event };
}

export async function updatePretixEventStatus(
  id: string,
  portalSlug: string,
  status: PortalPretixEventStatus,
): Promise<{ ok: true; event: PortalPretixEvent } | { ok: false; error: string }> {
  const store = await readStore();
  const slug = normalizeSlug(portalSlug);
  const index = store.events.findIndex((event) => event.id === id && event.portalSlug === slug);
  if (index < 0) return { ok: false, error: 'Event not found.' };
  const stamped = nowIso();
  const updated = { ...store.events[index], status, updatedAt: stamped };
  const events = [...store.events];
  events[index] = updated;
  await writeStore({ version: store.version, updatedAt: stamped, events });
  return { ok: true, event: updated };
}

export async function deletePretixEvent(
  id: string,
  portalSlug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const store = await readStore();
  const slug = normalizeSlug(portalSlug);
  const nextEvents = store.events.filter((event) => !(event.id === id && event.portalSlug === slug));
  if (nextEvents.length === store.events.length) return { ok: false, error: 'Event not found.' };
  await writeStore({ version: store.version, updatedAt: nowIso(), events: nextEvents });
  return { ok: true };
}

function safeEqualString(a: string, b: string): boolean {
  try {
    const left = Buffer.from(a, 'utf8');
    const right = Buffer.from(b, 'utf8');
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

/**
 * pretix ships no HMAC header — secure the callback with Basic Auth in the target URL
 * (`https://user:pass@host/api/webhooks/pretix`). We also accept Bearer and optional proxy HMAC.
 */
export function verifyPretixWebhookAuth(input: {
  rawBody: string;
  authorizationHeader: string | null;
  signatureHeader: string | null;
}): boolean {
  const secret = process.env.PRETIX_WEBHOOK_SECRET?.trim();
  if (!secret) return false;

  const auth = input.authorizationHeader?.trim() || '';
  if (auth.toLowerCase().startsWith('basic ')) {
    const expectedUser = (process.env.PRETIX_WEBHOOK_USER?.trim() || 'pretix').trim();
    try {
      const decoded = Buffer.from(auth.slice(6).trim(), 'base64').toString('utf8');
      const colon = decoded.indexOf(':');
      const user = colon >= 0 ? decoded.slice(0, colon) : decoded;
      const pass = colon >= 0 ? decoded.slice(colon + 1) : '';
      return safeEqualString(user, expectedUser) && safeEqualString(pass, secret);
    } catch {
      return false;
    }
  }

  if (auth.toLowerCase().startsWith('bearer ')) {
    return safeEqualString(auth.slice(7).trim(), secret);
  }

  // Optional proxy / Make bridge HMAC (not native pretix).
  const signatureHeader = input.signatureHeader?.trim();
  if (signatureHeader) {
    const expected = createHmac('sha256', secret).update(input.rawBody, 'utf8').digest('hex');
    const provided = signatureHeader.replace(/^sha256=/i, '');
    return safeEqualString(expected, provided);
  }

  return false;
}

/** @deprecated Prefer verifyPretixWebhookAuth — kept for older call sites/tests. */
export function verifyPretixWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  return verifyPretixWebhookAuth({
    rawBody,
    authorizationHeader: null,
    signatureHeader,
  });
}

/** Dev/demo fallback when secret unset — only allow on non-production. */
export function pretixWebhookAllowedWithoutSecret(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.PRETIX_ALLOW_INSECURE_WEBHOOK === '1';
}
