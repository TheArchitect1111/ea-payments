import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getAirtableApiKey } from './integration-env';
import type { EACPApprovalRecord, EACPCodexHandoffRecord, EACPLaunchRecord } from './eacp-launch';

export type EACPStoreData = {
  launches: EACPLaunchRecord[];
  approvals: EACPApprovalRecord[];
  codexHandoffs: EACPCodexHandoffRecord[];
};

const DEFAULT_STORE: EACPStoreData = {
  launches: [],
  approvals: [],
  codexHandoffs: [],
};

const STORE_FILE = path.join(process.cwd(), '.data', process.env.EACP_STORE_FILE_NAME || 'eacp-store.json');
const AIRTABLE_BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const AIRTABLE_TABLE = process.env.EACP_AIRTABLE_TABLE?.trim();
const AIRTABLE_KEY_FIELD = process.env.EACP_AIRTABLE_KEY_FIELD?.trim() || 'Key';
const AIRTABLE_PAYLOAD_FIELD = process.env.EACP_AIRTABLE_PAYLOAD_FIELD?.trim() || 'Payload';
const STORE_RECORD_KEY = 'eacp-store-v1';

export async function readEACPStore(): Promise<EACPStoreData> {
  const airtable = await readAirtableStore();
  if (airtable) return airtable;

  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<EACPStoreData>;
    return {
      launches: Array.isArray(parsed.launches) ? parsed.launches : [],
      approvals: Array.isArray(parsed.approvals) ? parsed.approvals : [],
      codexHandoffs: Array.isArray(parsed.codexHandoffs) ? parsed.codexHandoffs : [],
    };
  } catch {
    return structuredClone(DEFAULT_STORE);
  }
}

export async function writeEACPStore(data: EACPStoreData): Promise<void> {
  const wroteAirtable = await writeAirtableStore(data);
  if (wroteAirtable) return;

  await mkdir(path.dirname(STORE_FILE), { recursive: true });
  await writeFile(STORE_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function updateEACPStore(mutator: (data: EACPStoreData) => void | Promise<void>): Promise<EACPStoreData> {
  const data = await readEACPStore();
  await mutator(data);
  await writeEACPStore(data);
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
    const parsed = JSON.parse(payload) as Partial<EACPStoreData>;
    return {
      launches: Array.isArray(parsed.launches) ? parsed.launches : [],
      approvals: Array.isArray(parsed.approvals) ? parsed.approvals : [],
      codexHandoffs: Array.isArray(parsed.codexHandoffs) ? parsed.codexHandoffs : [],
    };
  } catch {
    return null;
  }
}

async function writeAirtableStore(data: EACPStoreData): Promise<boolean> {
  const key = getAirtableApiKey();
  if (!key || !AIRTABLE_TABLE) return false;

  const payload = JSON.stringify(data);
  try {
    const existing = await findAirtableStoreRecord(key);
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
    return res.ok;
  } catch {
    return false;
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
