import {
  airtableConfigured,
  airtableQuery,
  airtableUpsertByField,
  escapeAirtableString,
} from '@/lib/data/airtable-client';

const TABLE = process.env.AIRTABLE_CREATIVE_STUDIO_TABLE ?? 'Creative Studio';
const CHUNK_TABLE = process.env.AIRTABLE_CREATIVE_STUDIO_CHUNK_TABLE ?? 'EACP Store';
const PAYLOAD_CHUNK_SIZE = 90_000;
const CHUNK_MARKER = '__eaChunkedPayloadV1';
const CHUNK_KEY_SEPARATOR = '::payload-chunk::';

type MemoryRow = {
  payload: string;
  organizationId: string;
  title?: string;
  updatedAt: string;
};

type ChunkManifest = {
  [CHUNK_MARKER]: true;
  chunkCount: number;
  length: number;
};

const globalForStudio = globalThis as typeof globalThis & {
  __eaCreativeStudioMemory?: Map<string, MemoryRow>;
};

function studioMemory(): Map<string, MemoryRow> {
  if (!globalForStudio.__eaCreativeStudioMemory) {
    globalForStudio.__eaCreativeStudioMemory = new Map();
  }
  return globalForStudio.__eaCreativeStudioMemory;
}

export function studioRecordKey(recordType: 'campaign' | 'brand' | 'media' | 'experience', id: string): string {
  return `${recordType}:${id}`;
}

const RECORD_TYPE_LABEL: Record<'campaign' | 'brand' | 'media' | 'experience', string> = {
  campaign: 'Campaign',
  brand: 'Brand',
  media: 'Media',
  experience: 'Experience',
};

export type SaveStudioRecordResult = {
  ok: boolean;
  /** True when Airtable is configured and the upsert succeeded. */
  persistedToAirtable: boolean;
  error?: string;
};

function chunkKey(recordKey: string, index: number): string {
  return `${recordKey}${CHUNK_KEY_SEPARATOR}${String(index).padStart(4, '0')}`;
}

function chunkManifest(raw: string): ChunkManifest | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ChunkManifest>;
    if (
      parsed?.[CHUNK_MARKER] === true &&
      Number.isInteger(parsed.chunkCount) &&
      Number(parsed.chunkCount) > 0 &&
      Number.isInteger(parsed.length) &&
      Number(parsed.length) >= 0
    ) {
      return parsed as ChunkManifest;
    }
  } catch {
    // Ordinary JSON payload, not a chunk manifest.
  }
  return null;
}

async function preparePayloadForAirtable(recordKey: string, payload: string): Promise<string> {
  if (payload.length <= PAYLOAD_CHUNK_SIZE) return payload;

  const chunks: string[] = [];
  for (let offset = 0; offset < payload.length; offset += PAYLOAD_CHUNK_SIZE) {
    chunks.push(payload.slice(offset, offset + PAYLOAD_CHUNK_SIZE));
  }

  for (let index = 0; index < chunks.length; index += 1) {
    const key = chunkKey(recordKey, index);
    const saved = await airtableUpsertByField(
      CHUNK_TABLE,
      'Key',
      key,
      { Key: key, Payload: chunks[index] },
      false,
    );
    if (!saved) throw new Error(`Airtable payload chunk ${index + 1}/${chunks.length} failed`);
  }

  const manifest: ChunkManifest = {
    [CHUNK_MARKER]: true,
    chunkCount: chunks.length,
    length: payload.length,
  };
  return JSON.stringify(manifest);
}

async function hydratePayloadFromAirtable(recordKey: string, stored: string): Promise<string | null> {
  const manifest = chunkManifest(stored);
  if (!manifest) return stored;

  const chunks: string[] = [];
  for (let index = 0; index < manifest.chunkCount; index += 1) {
    const key = chunkKey(recordKey, index);
    const formula = `{Key}='${escapeAirtableString(key)}'`;
    const rows = await airtableQuery(CHUNK_TABLE, { filterByFormula: formula, maxRecords: 1 });
    const chunk = rows[0]?.fields?.Payload;
    if (typeof chunk !== 'string') return null;
    chunks.push(chunk);
  }

  const payload = chunks.join('');
  if (payload.length !== manifest.length) return null;
  return payload;
}

export function clearStudioMemoryKey(
  recordType: 'campaign' | 'brand' | 'media' | 'experience',
  id: string,
): void {
  studioMemory().delete(studioRecordKey(recordType, id));
}

export async function saveStudioRecord(input: {
  recordType: 'campaign' | 'brand' | 'media' | 'experience';
  id: string;
  organizationId: string;
  payload: unknown;
  title?: string;
}): Promise<SaveStudioRecordResult> {
  const key = studioRecordKey(input.recordType, input.id);
  const updatedAt = new Date().toISOString();
  const payload = JSON.stringify(input.payload);
  studioMemory().set(key, {
    payload,
    organizationId: input.organizationId,
    title: input.title,
    updatedAt,
  });

  if (!airtableConfigured()) {
    return { ok: true, persistedToAirtable: false, error: 'Airtable not configured' };
  }

  try {
    const storedPayload = await preparePayloadForAirtable(key, payload);
    const saved = await airtableUpsertByField(
      TABLE,
      'Record Key',
      key,
      {
        'Record Key': key,
        'Record Type': RECORD_TYPE_LABEL[input.recordType],
        'Organization ID': input.organizationId,
        Title: input.title ?? input.id,
        'Payload JSON': storedPayload,
        'Updated At': updatedAt,
      },
      true,
    );
    if (!saved) {
      return { ok: false, persistedToAirtable: false, error: 'Airtable upsert returned empty' };
    }
    return { ok: true, persistedToAirtable: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Airtable save failed';
    console.error('[creative-studio] Airtable save failed:', err);
    return { ok: false, persistedToAirtable: false, error: message };
  }
}

/** Load from Airtable only (skips memory cache). Used to verify durable writes. */
export async function loadStudioRecordFromAirtable<T>(
  recordType: 'campaign' | 'brand' | 'media' | 'experience',
  id: string,
): Promise<T | null> {
  if (!airtableConfigured()) return null;

  const key = studioRecordKey(recordType, id);
  try {
    const formula = `{Record Key}='${escapeAirtableString(key)}'`;
    const records = await airtableQuery(TABLE, { filterByFormula: formula, maxRecords: 1 });
    const raw = records[0]?.fields?.['Payload JSON'];
    if (typeof raw !== 'string' || !raw.trim()) return null;
    const hydrated = await hydratePayloadFromAirtable(key, raw);
    if (!hydrated) return null;
    return JSON.parse(hydrated) as T;
  } catch (err) {
    console.error('[creative-studio] Airtable durable load failed:', err);
    return null;
  }
}

export async function loadStudioRecord<T>(
  recordType: 'campaign' | 'brand' | 'media' | 'experience',
  id: string,
): Promise<T | null> {
  const key = studioRecordKey(recordType, id);
  const cached = studioMemory().get(key);
  if (cached) {
    try {
      return JSON.parse(cached.payload) as T;
    } catch {
      return null;
    }
  }

  if (!airtableConfigured()) return null;

  try {
    const formula = `{Record Key}='${escapeAirtableString(key)}'`;
    const records = await airtableQuery(TABLE, { filterByFormula: formula, maxRecords: 1 });
    const raw = records[0]?.fields?.['Payload JSON'];
    if (typeof raw !== 'string' || !raw.trim()) return null;
    const hydrated = await hydratePayloadFromAirtable(key, raw);
    if (!hydrated) return null;

    const parsed = JSON.parse(hydrated) as T;
    studioMemory().set(key, {
      payload: hydrated,
      organizationId: String(records[0]?.fields?.['Organization ID'] ?? 'ea'),
      title: String(records[0]?.fields?.Title ?? ''),
      updatedAt: String(records[0]?.fields?.['Updated At'] ?? new Date().toISOString()),
    });
    return parsed;
  } catch (err) {
    console.error('[creative-studio] Airtable load failed:', err);
    return null;
  }
}

export async function listStudioRecords<T>(
  recordType: 'campaign' | 'brand' | 'media' | 'experience',
  organizationId: string,
): Promise<T[]> {
  const prefix = `${recordType}:`;
  const fromMemory = [...studioMemory().entries()]
    .filter(([key, row]) => key.startsWith(prefix) && row.organizationId === organizationId)
    .map(([, row]) => {
      try {
        return JSON.parse(row.payload) as T;
      } catch {
        return null;
      }
    })
    .filter((row): row is T => row !== null);

  if (!airtableConfigured()) return fromMemory;

  try {
    const formula = `AND({Record Type}='${RECORD_TYPE_LABEL[recordType]}',{Organization ID}='${escapeAirtableString(organizationId)}')`;
    const records = await airtableQuery(TABLE, {
      filterByFormula: formula,
      maxRecords: 100,
      sortField: 'Updated At',
      sortDirection: 'desc',
    });

    const hydratedRows = await Promise.all(records.map(async (record) => {
      const raw = record.fields?.['Payload JSON'];
      const recordKey = String(record.fields?.['Record Key'] ?? '');
      if (typeof raw !== 'string' || !recordKey) return null;
      const hydrated = await hydratePayloadFromAirtable(recordKey, raw);
      if (!hydrated) return null;
      studioMemory().set(recordKey, {
        payload: hydrated,
        organizationId,
        title: String(record.fields?.Title ?? ''),
        updatedAt: String(record.fields?.['Updated At'] ?? ''),
      });
      try {
        return JSON.parse(hydrated) as T;
      } catch {
        return null;
      }
    }));

    const fromAirtable = hydratedRows.filter((row): row is T => row !== null);
    return fromAirtable.length ? fromAirtable : fromMemory;
  } catch (err) {
    console.error('[creative-studio] Airtable list failed:', err);
    return fromMemory;
  }
}

export async function listAllStudioRecords<T>(
  recordType: 'campaign' | 'brand' | 'media' | 'experience',
): Promise<T[]> {
  const prefix = `${recordType}:`;
  const fromMemory = [...studioMemory().entries()]
    .filter(([key]) => key.startsWith(prefix))
    .map(([, row]) => {
      try {
        return JSON.parse(row.payload) as T;
      } catch {
        return null;
      }
    })
    .filter((row): row is T => row !== null);

  if (!airtableConfigured()) return fromMemory;

  try {
    const formula = `{Record Type}='${RECORD_TYPE_LABEL[recordType]}'`;
    const records = await airtableQuery(TABLE, {
      filterByFormula: formula,
      maxRecords: 100,
      sortField: 'Updated At',
      sortDirection: 'desc',
    });
    const hydratedRows = await Promise.all(records.map(async (record) => {
      const raw = record.fields?.['Payload JSON'];
      const recordKey = String(record.fields?.['Record Key'] ?? '');
      if (typeof raw !== 'string' || !recordKey) return null;
      const hydrated = await hydratePayloadFromAirtable(recordKey, raw);
      if (!hydrated) return null;
      studioMemory().set(recordKey, {
        payload: hydrated,
        organizationId: String(record.fields?.['Organization ID'] ?? 'ea'),
        title: String(record.fields?.Title ?? ''),
        updatedAt: String(record.fields?.['Updated At'] ?? ''),
      });
      try {
        return JSON.parse(hydrated) as T;
      } catch {
        return null;
      }
    }));
    const rows = hydratedRows.filter((row): row is T => row !== null);
    return rows.length ? rows : fromMemory;
  } catch (err) {
    console.error('[creative-studio] Airtable list-all failed:', err);
    return fromMemory;
  }
}
