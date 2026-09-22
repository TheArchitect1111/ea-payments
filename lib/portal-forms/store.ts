/**
 * Portal form submissions ledger — intake + applications share one store.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import {
  escapeAirtableString,
  platformQuery,
  platformStoreConfigured,
  platformUpsertByField,
} from '@/lib/platform-store';
import type {
  PortalFormKind,
  PortalFormStatus,
  PortalFormSubmission,
} from '@/lib/portal-forms/types';

export const PORTAL_FORM_SUBMISSIONS_TABLE =
  process.env.AIRTABLE_PORTAL_FORM_SUBMISSIONS_TABLE?.trim() || 'Portal Form Submissions';

const STORE_FILE_NAME = 'portal-form-submissions.json';
const STORE_FILE = process.env.VERCEL
  ? path.join(os.tmpdir(), STORE_FILE_NAME)
  : path.join(/* turbopackIgnore: true */ process.cwd(), '.data', STORE_FILE_NAME);

const MEMORY_CAP = 500;
let memoryRows: PortalFormSubmission[] = [];

function nowIso() {
  return new Date().toISOString();
}

function newSubmissionId() {
  return `pfs_${Date.now().toString(36)}_${randomBytes(3).toString('hex')}`;
}

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

function mapRow(row: { id: string; fields: Record<string, unknown> }): PortalFormSubmission {
  let payload: Record<string, unknown> | undefined;
  const payloadRaw = row.fields['Payload JSON'];
  if (typeof payloadRaw === 'string' && payloadRaw.trim()) {
    try {
      payload = JSON.parse(payloadRaw) as Record<string, unknown>;
    } catch {
      payload = undefined;
    }
  }

  return {
    id: String(row.fields['Submission ID'] || row.id),
    portalSlug: normalizeSlug(String(row.fields['Portal Slug'] || '')),
    kind: String(row.fields.Kind || 'intake') as PortalFormKind,
    status: (String(row.fields.Status || 'submitted') as PortalFormStatus) || 'submitted',
    email: String(row.fields.Email || '').trim(),
    name: String(row.fields.Name || '').trim(),
    phone: row.fields.Phone ? String(row.fields.Phone) : undefined,
    notes: row.fields.Notes ? String(row.fields.Notes) : undefined,
    payload,
    createdAt: String(row.fields['Created At'] || new Date().toISOString()),
    updatedAt: String(row.fields['Updated At'] || new Date().toISOString()),
  };
}

function submissionToFields(submission: PortalFormSubmission): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    'Submission ID': submission.id,
    'Portal Slug': submission.portalSlug,
    Kind: submission.kind,
    Status: submission.status,
    Email: submission.email,
    Name: submission.name,
    'Created At': submission.createdAt,
    'Updated At': submission.updatedAt,
  };
  if (submission.phone) fields.Phone = submission.phone;
  if (submission.notes) fields.Notes = submission.notes;
  if (submission.payload && Object.keys(submission.payload).length > 0) {
    fields['Payload JSON'] = JSON.stringify(submission.payload);
  }
  return fields;
}

async function readMemoryStore(): Promise<PortalFormSubmission[]> {
  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as PortalFormSubmission[];
    if (Array.isArray(parsed)) {
      memoryRows = parsed;
      return parsed;
    }
  } catch {
    // fall through
  }
  return memoryRows;
}

async function writeMemoryStore(rows: PortalFormSubmission[]): Promise<void> {
  memoryRows = rows.slice(0, MEMORY_CAP);
  try {
    await mkdir(path.dirname(STORE_FILE), { recursive: true });
    await writeFile(STORE_FILE, JSON.stringify(memoryRows, null, 2), 'utf8');
  } catch {
    // read-only FS — memory remains source of truth
  }
}

async function upsertToAirtable(submission: PortalFormSubmission): Promise<PortalFormSubmission> {
  const record = await platformUpsertByField(
    PORTAL_FORM_SUBMISSIONS_TABLE,
    'Submission ID',
    submission.id,
    submissionToFields(submission),
  );
  return record ? mapRow(record) : submission;
}

async function listFromAirtable(
  portalSlug: string,
  kind?: PortalFormKind,
): Promise<PortalFormSubmission[]> {
  const slug = escapeAirtableString(normalizeSlug(portalSlug));
  let formula = `{Portal Slug} = '${slug}'`;
  if (kind) {
    formula = `AND(${formula}, {Kind} = '${escapeAirtableString(kind)}')`;
  }
  const rows = await platformQuery(PORTAL_FORM_SUBMISSIONS_TABLE, { filterByFormula: formula });
  return rows.map(mapRow).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type CreatePortalFormSubmissionInput = {
  portalSlug: string;
  kind: PortalFormKind;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  payload?: Record<string, unknown>;
};

export async function createPortalFormSubmission(
  input: CreatePortalFormSubmissionInput,
): Promise<PortalFormSubmission> {
  const stamped = nowIso();
  const submission: PortalFormSubmission = {
    id: newSubmissionId(),
    portalSlug: normalizeSlug(input.portalSlug),
    kind: input.kind,
    status: 'submitted',
    email: input.email.trim(),
    name: input.name.trim(),
    phone: input.phone?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    payload: input.payload,
    createdAt: stamped,
    updatedAt: stamped,
  };

  if (platformStoreConfigured()) {
    return upsertToAirtable(submission);
  }

  const rows = await readMemoryStore();
  rows.unshift(submission);
  await writeMemoryStore(rows);
  return submission;
}

export async function listPortalFormSubmissions(
  portalSlug: string,
  options?: { kind?: PortalFormKind; email?: string },
): Promise<PortalFormSubmission[]> {
  if (platformStoreConfigured()) {
    const rows = await listFromAirtable(portalSlug, options?.kind);
    if (options?.email) {
      const email = options.email.trim().toLowerCase();
      return rows.filter((row) => row.email.toLowerCase() === email);
    }
    return rows;
  }

  const rows = await readMemoryStore();
  const slug = normalizeSlug(portalSlug);
  return rows
    .filter((row) => row.portalSlug === slug)
    .filter((row) => (options?.kind ? row.kind === options.kind : true))
    .filter((row) =>
      options?.email ? row.email.toLowerCase() === options.email.trim().toLowerCase() : true,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updatePortalFormSubmissionStatus(input: {
  portalSlug: string;
  submissionId: string;
  status: PortalFormStatus;
}): Promise<PortalFormSubmission | null> {
  const slug = normalizeSlug(input.portalSlug);
  const updatedAt = nowIso();

  if (platformStoreConfigured()) {
    const formula = `AND({Submission ID} = '${escapeAirtableString(input.submissionId)}', {Portal Slug} = '${escapeAirtableString(slug)}')`;
    const rows = await platformQuery(PORTAL_FORM_SUBMISSIONS_TABLE, { filterByFormula: formula });
    const existing = rows[0] ? mapRow(rows[0]) : null;
    if (!existing) return null;
    const next = { ...existing, status: input.status, updatedAt };
    return upsertToAirtable(next);
  }

  const rows = await readMemoryStore();
  const index = rows.findIndex((row) => row.id === input.submissionId && row.portalSlug === slug);
  if (index < 0) return null;
  const next = { ...rows[index], status: input.status, updatedAt };
  rows[index] = next;
  await writeMemoryStore(rows);
  return next;
}
