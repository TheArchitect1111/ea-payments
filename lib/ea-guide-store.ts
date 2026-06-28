import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getAirtableApiKey } from './integration-env';
import type { EscalationRecord, GuideProgress } from './ea-guide-types';

export type EAGuideStoreData = {
  version: number;
  updatedAt: string;
  progress: GuideProgress[];
  escalations: EscalationRecord[];
};

const DEFAULT_STORE: EAGuideStoreData = {
  version: 0,
  updatedAt: '',
  progress: [],
  escalations: [],
};

const STORE_FILE = process.env.VERCEL
  ? path.join(os.tmpdir(), 'ea-guide-store.json')
  : path.join(/* turbopackIgnore: true */ process.cwd(), '.data', 'ea-guide-store.json');

const AIRTABLE_BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const AIRTABLE_TABLE = (process.env.EA_GUIDE_AIRTABLE_TABLE ?? process.env.EACP_AIRTABLE_TABLE)?.trim();
const AIRTABLE_KEY_FIELD = process.env.EACP_AIRTABLE_KEY_FIELD?.trim() || 'Key';
const AIRTABLE_PAYLOAD_FIELD = process.env.EACP_AIRTABLE_PAYLOAD_FIELD?.trim() || 'Payload';
const STORE_RECORD_KEY = 'ea-guide-store-v1';

function requiresDurablePersistence() {
  return process.env.VERCEL === '1' || process.env.VERCEL === 'true';
}

export class EAGuidePersistenceConfigurationError extends Error {
  code = 'EA_GUIDE_PERSISTENCE_NOT_CONFIGURED';

  constructor() {
    super(
      'EA Guide durable persistence is not configured. Set EA_GUIDE_AIRTABLE_TABLE (or EACP_AIRTABLE_TABLE) and AIRTABLE_API_KEY so escalations and tour progress survive in production.',
    );
  }
}

export async function readEAGuideStore(): Promise<EAGuideStoreData> {
  const airtable = await readAirtableStore();
  if (airtable) return airtable;

  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    return normalizeStore(JSON.parse(raw) as Partial<EAGuideStoreData>);
  } catch {
    return structuredClone(DEFAULT_STORE);
  }
}

export async function writeEAGuideStore(data: EAGuideStoreData): Promise<void> {
  const wroteAirtable = await writeAirtableStore(data);
  if (wroteAirtable) return;

  if (requiresDurablePersistence()) {
    throw new EAGuidePersistenceConfigurationError();
  }

  await mkdir(path.dirname(STORE_FILE), { recursive: true });
  await writeFile(STORE_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function updateEAGuideStore(
  mutator: (data: EAGuideStoreData) => void | Promise<void>,
): Promise<EAGuideStoreData> {
  const data = await readEAGuideStore();
  await mutator(data);
  data.version += 1;
  data.updatedAt = new Date().toISOString();
  await writeEAGuideStore(data);
  return data;
}

export async function upsertGuideProgress(entry: GuideProgress): Promise<GuideProgress> {
  await updateEAGuideStore((data) => {
    const index = data.progress.findIndex(
      (row) => row.userId === entry.userId && row.tourId === entry.tourId,
    );
    if (index >= 0) data.progress[index] = { ...data.progress[index], ...entry };
    else data.progress.push(entry);
  });
  return entry;
}

export async function listGuideProgress(userId: string): Promise<GuideProgress[]> {
  const store = await readEAGuideStore();
  return store.progress.filter((row) => row.userId === userId);
}

export async function createEscalation(record: EscalationRecord): Promise<EscalationRecord> {
  await updateEAGuideStore((data) => {
    data.escalations.unshift(record);
    if (data.escalations.length > 500) data.escalations.length = 500;
  });
  return record;
}

export async function listEscalations(limit = 50): Promise<EscalationRecord[]> {
  const store = await readEAGuideStore();
  return store.escalations.slice(0, limit);
}

async function readAirtableStore(): Promise<EAGuideStoreData | null> {
  const key = getAirtableApiKey();
  if (!key || !AIRTABLE_TABLE) return null;

  try {
    const params = new URLSearchParams({
      maxRecords: '1',
      filterByFormula: `{${AIRTABLE_KEY_FIELD}}='${STORE_RECORD_KEY}'`,
    });
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?${params}`,
      { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { records?: Array<{ fields?: Record<string, unknown> }> };
    const payload = data.records?.[0]?.fields?.[AIRTABLE_PAYLOAD_FIELD];
    if (typeof payload !== 'string') return structuredClone(DEFAULT_STORE);
    return normalizeStore(JSON.parse(payload) as Partial<EAGuideStoreData>);
  } catch {
    return null;
  }
}

async function writeAirtableStore(data: EAGuideStoreData): Promise<boolean> {
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
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE ?? '')}?${params}`,
    { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { records?: Array<{ id: string }> };
  return data.records?.[0]?.id ?? null;
}

function normalizeStore(parsed: Partial<EAGuideStoreData>): EAGuideStoreData {
  return {
    version: Number.isFinite(parsed.version) ? Number(parsed.version) : 0,
    updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    progress: Array.isArray(parsed.progress) ? parsed.progress : [],
    escalations: Array.isArray(parsed.escalations) ? parsed.escalations : [],
  };
}
