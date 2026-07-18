import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getAirtableApiKey } from './integration-env';
import type { EACPApprovalRecord, EACPAuditEvent, EACPCodexHandoffRecord, EACPLaunchRecord } from './eacp-launch';

export type EACPStoreData = {
  version: number;
  updatedAt: string;
  launches: EACPLaunchRecord[];
  approvals: EACPApprovalRecord[];
  codexHandoffs: EACPCodexHandoffRecord[];
  auditEvents: EACPAuditEvent[];
};

const DEFAULT_STORE: EACPStoreData = {
  version: 0,
  updatedAt: '',
  launches: [],
  approvals: [],
  codexHandoffs: [],
  auditEvents: [],
};

const STORE_FILE_NAME = process.env.EACP_STORE_FILE_NAME || 'eacp-store.json';
const STORE_FILE = process.env.VERCEL
  ? path.join(os.tmpdir(), STORE_FILE_NAME)
  : path.join(/* turbopackIgnore: true */ process.cwd(), '.data', STORE_FILE_NAME);
const AIRTABLE_BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const AIRTABLE_TABLE = process.env.EACP_AIRTABLE_TABLE?.trim() || 'EACP Store';
const AIRTABLE_KEY_FIELD = process.env.EACP_AIRTABLE_KEY_FIELD?.trim() || 'Key';
const AIRTABLE_PAYLOAD_FIELD = process.env.EACP_AIRTABLE_PAYLOAD_FIELD?.trim() || 'Payload';
const STORE_RECORD_KEY = 'eacp-store-v1';
let eacpTableEnsureAttempted = false;

export class EACPStoreConflictError extends Error {
  code = 'EACP_STORE_CONFLICT';

  constructor() {
    super('EACP store update conflict. Reload the launch and retry.');
  }
}

export class EACPPersistenceConfigurationError extends Error {
  code = 'EACP_PERSISTENCE_NOT_CONFIGURED';

  constructor() {
    super('EACP durable persistence is not configured. Set Airtable environment variables before writing launches in production.');
  }
}

export async function readEACPStore(): Promise<EACPStoreData> {
  const airtable = await readAirtableStore();
  if (airtable) return airtable;

  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    return normalizeStore(JSON.parse(raw) as Partial<EACPStoreData>);
  } catch {
    return structuredClone(DEFAULT_STORE);
  }
}

export async function writeEACPStore(data: EACPStoreData, expectedVersion?: number): Promise<void> {
  const wroteAirtable = await writeAirtableStore(data, expectedVersion);
  if (wroteAirtable) return;

  if (requiresDurablePersistence()) {
    throw new EACPPersistenceConfigurationError();
  }

  if (expectedVersion !== undefined) {
    const current = await readFileStore();
    if (current.version !== expectedVersion) throw new EACPStoreConflictError();
  }

  await mkdir(path.dirname(STORE_FILE), { recursive: true });
  await writeFile(STORE_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function updateEACPStore(mutator: (data: EACPStoreData) => void | false | Promise<void | false>): Promise<EACPStoreData> {
  const data = await readEACPStore();
  const expectedVersion = data.version;
  const result = await mutator(data);
  if (result === false) return data;
  data.version = expectedVersion + 1;
  data.updatedAt = new Date().toISOString();
  await writeEACPStore(data, expectedVersion);
  return data;
}

async function readAirtableStore(): Promise<EACPStoreData | null> {
  const key = getAirtableApiKey();
  if (!key || !AIRTABLE_TABLE) return null;

  try {
    const params = new URLSearchParams({
      maxRecords: '1',
      filterByFormula: `{${AIRTABLE_KEY_FIELD}}='${STORE_RECORD_KEY}'`,
    });
    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?${params}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json() as { records?: Array<{ fields?: Record<string, unknown> }> };
    const payload = data.records?.[0]?.fields?.[AIRTABLE_PAYLOAD_FIELD];
    if (typeof payload !== 'string') return structuredClone(DEFAULT_STORE);
    return normalizeStore(JSON.parse(payload) as Partial<EACPStoreData>);
  } catch {
    return null;
  }
}

async function writeAirtableStore(data: EACPStoreData, expectedVersion?: number): Promise<boolean> {
  const key = getAirtableApiKey();
  if (!key || !AIRTABLE_TABLE) return false;

  // Keep payload under Airtable multiline limits by retaining a rolling window.
  const compact: EACPStoreData = {
    ...data,
    launches: data.launches.slice(0, 40),
    approvals: data.approvals.slice(0, 40),
    codexHandoffs: data.codexHandoffs.slice(0, 40),
    auditEvents: data.auditEvents.slice(-200),
  };
  const payload = JSON.stringify(compact);
  try {
    const wrote = await persistAirtableStorePayload(key, payload, expectedVersion);
    if (wrote) return true;

    if (!eacpTableEnsureAttempted) {
      eacpTableEnsureAttempted = true;
      try {
        const { ensureEACPStoreTable } = await import('./eacp-store-setup');
        const setup = await ensureEACPStoreTable();
        if (setup.ok) {
          return persistAirtableStorePayload(key, payload, expectedVersion);
        }
      } catch (setupError) {
        console.error('[eacp-store] ensure table failed', setupError);
      }
    }
    return false;
  } catch (error) {
    if (error instanceof EACPStoreConflictError) throw error;
    console.error('[eacp-store] write failed', error);
    return false;
  }
}

async function persistAirtableStorePayload(
  key: string,
  payload: string,
  expectedVersion?: number,
): Promise<boolean> {
  const existing = await findAirtableStoreRecord(key);
  if (expectedVersion !== undefined) {
    const current = await readAirtableStore();
    if (current && current.version !== expectedVersion) throw new EACPStoreConflictError();
  }

  const body = JSON.stringify({
    fields: {
      [AIRTABLE_KEY_FIELD]: STORE_RECORD_KEY,
      [AIRTABLE_PAYLOAD_FIELD]: payload,
    },
  });
  const url = existing
    ? `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}/${existing}`
    : `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`;
  const res = await fetch(url, {
    method: existing ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  if (!res.ok) {
    console.error('[eacp-store] Airtable write failed', res.status, await res.text().catch(() => ''));
  }
  return res.ok;
}

async function readFileStore(): Promise<EACPStoreData> {
  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    return normalizeStore(JSON.parse(raw) as Partial<EACPStoreData>);
  } catch {
    return structuredClone(DEFAULT_STORE);
  }
}

async function findAirtableStoreRecord(key: string): Promise<string | null> {
  const params = new URLSearchParams({
    maxRecords: '1',
    filterByFormula: `{${AIRTABLE_KEY_FIELD}}='${STORE_RECORD_KEY}'`,
  });
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE ?? '')}?${params}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json() as { records?: Array<{ id: string }> };
  return data.records?.[0]?.id ?? null;
}

function normalizeStore(parsed: Partial<EACPStoreData>): EACPStoreData {
  const launches = Array.isArray(parsed.launches) ? parsed.launches : [];
  const embeddedAuditEvents = launches.flatMap((launch) => Array.isArray(launch.auditTrail) ? launch.auditTrail : []);
  const auditEvents = Array.isArray(parsed.auditEvents) ? parsed.auditEvents : embeddedAuditEvents;

  return {
    version: Number.isFinite(parsed.version) ? Number(parsed.version) : 0,
    updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    launches,
    approvals: Array.isArray(parsed.approvals) ? parsed.approvals : [],
    codexHandoffs: Array.isArray(parsed.codexHandoffs) ? parsed.codexHandoffs : [],
    auditEvents,
  };
}

function requiresDurablePersistence() {
  return process.env.VERCEL === '1' || process.env.VERCEL === 'true';
}
