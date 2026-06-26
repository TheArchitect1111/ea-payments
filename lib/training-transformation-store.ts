import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getAirtableApiKey } from './integration-env';
import { emitPulseEvent } from './pulse-bus';
import type { EAGeneratedOutput, EARecommendation, EAUnderstanding, EAWorkflowResult } from './ea-intelligence';

export type TrainingTransformationStatus = 'review-ready' | 'approved' | 'published' | 'archived';

export type TrainingTransformationRecord = {
  id: string;
  status: TrainingTransformationStatus;
  title: string;
  tenantId?: string;
  source: {
    kind: string;
    fileName?: string;
    mimeType?: string;
    extractionStatus?: string;
    extractionNotes?: string[];
  };
  understanding: EAUnderstanding;
  recommendations: EARecommendation[];
  outputs: EAGeneratedOutput[];
  publishTargets: string[];
  measuredSignals: string[];
  pulseActivityId: string;
  publishedTargets: string[];
  createdAt: string;
  updatedAt: string;
};

type StoreData = {
  version: number;
  updatedAt: string;
  records: TrainingTransformationRecord[];
};

const DEFAULT_STORE: StoreData = {
  version: 0,
  updatedAt: '',
  records: [],
};

const STORE_FILE_NAME = 'training-transformations.json';
const STORE_FILE = process.env.VERCEL
  ? path.join(os.tmpdir(), STORE_FILE_NAME)
  : path.join(/* turbopackIgnore: true */ process.cwd(), '.data', STORE_FILE_NAME);
const AIRTABLE_BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const AIRTABLE_TABLE = process.env.TRAINING_TRANSFORMATIONS_TABLE?.trim() || process.env.EACP_AIRTABLE_TABLE?.trim();
const AIRTABLE_KEY_FIELD = process.env.TRAINING_TRANSFORMATIONS_KEY_FIELD?.trim() || process.env.EACP_AIRTABLE_KEY_FIELD?.trim() || 'Key';
const AIRTABLE_PAYLOAD_FIELD = process.env.TRAINING_TRANSFORMATIONS_PAYLOAD_FIELD?.trim() || process.env.EACP_AIRTABLE_PAYLOAD_FIELD?.trim() || 'Payload';
const STORE_RECORD_KEY = 'training-transformations-v1';
const MEMORY_CAP = 100;
let memoryStore: StoreData = structuredClone(DEFAULT_STORE);

export async function listTrainingTransformations(): Promise<TrainingTransformationRecord[]> {
  const store = await readStore();
  return [...store.records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listPublishedTrainingForTenant(tenantId: string): Promise<TrainingTransformationRecord[]> {
  const records = await listTrainingTransformations();
  return records.filter((record) => record.status === 'published' && record.tenantId === tenantId);
}

export async function getTrainingTransformation(id: string): Promise<TrainingTransformationRecord | null> {
  const store = await readStore();
  return store.records.find((record) => record.id === id) ?? null;
}

export async function createTrainingTransformationFromWorkflow(
  result: EAWorkflowResult,
  extraction?: { extractionStatus?: string; extractionNotes?: string[] },
): Promise<TrainingTransformationRecord> {
  const now = new Date().toISOString();
  const record: TrainingTransformationRecord = {
    id: `tt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'review-ready',
    title: result.input.title || result.input.fileName || 'Training Transformation',
    tenantId: result.input.tenantId,
    source: {
      kind: result.input.kind,
      fileName: result.input.fileName,
      mimeType: result.input.mimeType,
      extractionStatus: extraction?.extractionStatus,
      extractionNotes: extraction?.extractionNotes,
    },
    understanding: result.understanding,
    recommendations: result.recommendations,
    outputs: result.outputs,
    publishTargets: result.publishTargets,
    measuredSignals: result.measuredSignals,
    pulseActivityId: result.pulseActivityId,
    publishedTargets: [],
    createdAt: now,
    updatedAt: now,
  };

  await updateStore((store) => {
    store.records.unshift(record);
    store.records = store.records.slice(0, MEMORY_CAP);
  });

  return record;
}

export async function updateTrainingTransformation(
  id: string,
  patch: Partial<Pick<TrainingTransformationRecord, 'status' | 'outputs' | 'publishTargets' | 'tenantId'>>,
): Promise<TrainingTransformationRecord | null> {
  let updated: TrainingTransformationRecord | null = null;
  await updateStore((store) => {
    const record = store.records.find((item) => item.id === id);
    if (!record) return false;
    Object.assign(record, patch);
    record.updatedAt = new Date().toISOString();
    updated = record;
  });
  return updated;
}

export async function publishTrainingTransformation(id: string, targets: string[]): Promise<TrainingTransformationRecord | null> {
  const uniqueTargets = [...new Set(targets.filter(Boolean))];

  await updateStore((store) => {
    const record = store.records.find((item) => item.id === id);
    if (!record) return false;
    record.status = 'published';
    record.publishedTargets = uniqueTargets.length ? uniqueTargets : record.publishTargets;
    record.updatedAt = new Date().toISOString();
  });

  const publishedRecord = await getTrainingTransformation(id);
  if (publishedRecord) {
    await emitPulseEvent({
      product: 'ea-platform',
      type: 'update.published',
      title: `Training published: ${publishedRecord.title}`,
      detail: `Published to ${publishedRecord.publishedTargets.join(', ') || 'Training Hub'}.`,
      priority: 'medium',
      href: publishedRecord.tenantId ? `/portal/${publishedRecord.tenantId}/learning` : '/admin/ea-factory/training-transformations',
      tenantId: publishedRecord.tenantId,
      objectId: publishedRecord.id,
      metadata: {
        engine: 'ea-intelligence',
        workflow: 'training-transformation',
        outputCount: publishedRecord.outputs.length,
      },
    });
  }

  return publishedRecord;
}

async function readStore(): Promise<StoreData> {
  const airtable = await readAirtableStore();
  if (airtable) return airtable;

  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    const store = normalizeStore(parsed);
    memoryStore = store;
    return store;
  } catch {
    return memoryStore;
  }
}

async function updateStore(mutator: (store: StoreData) => void | false): Promise<StoreData> {
  const store = structuredClone(await readStore());
  const result = mutator(store);
  if (result === false) return store;
  store.version += 1;
  store.updatedAt = new Date().toISOString();
  memoryStore = store;

  const wroteAirtable = await writeAirtableStore(store);
  if (wroteAirtable) return store;

  try {
    await mkdir(path.dirname(STORE_FILE), { recursive: true });
    await writeFile(STORE_FILE, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
  } catch {
    // Vercel can run on ephemeral storage. Keep an in-memory queue rather than dropping the workflow.
  }

  return store;
}

async function readAirtableStore(): Promise<StoreData | null> {
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
    const store = normalizeStore(JSON.parse(payload) as Partial<StoreData>);
    memoryStore = store;
    return store;
  } catch {
    return null;
  }
}

async function writeAirtableStore(store: StoreData): Promise<boolean> {
  const key = getAirtableApiKey();
  if (!key || !AIRTABLE_TABLE) return false;

  try {
    const existing = await findAirtableRecord(key);
    const url = existing
      ? `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}/${existing}`
      : `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`;
    const res = await fetch(url, {
      method: existing ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          [AIRTABLE_KEY_FIELD]: STORE_RECORD_KEY,
          [AIRTABLE_PAYLOAD_FIELD]: JSON.stringify(store),
        },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function findAirtableRecord(key: string): Promise<string | null> {
  if (!AIRTABLE_TABLE) return null;
  const params = new URLSearchParams({
    maxRecords: '1',
    filterByFormula: `{${AIRTABLE_KEY_FIELD}}='${STORE_RECORD_KEY}'`,
  });
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?${params}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json() as { records?: Array<{ id: string }> };
  return data.records?.[0]?.id ?? null;
}

function normalizeStore(parsed: Partial<StoreData>): StoreData {
  return {
    version: Number.isFinite(parsed.version) ? Number(parsed.version) : 0,
    updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    records: Array.isArray(parsed.records) ? parsed.records : [],
  };
}
