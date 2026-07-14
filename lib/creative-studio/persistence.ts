import {
  airtableConfigured,
  airtableQuery,
  airtableUpsertByField,
  escapeAirtableString,
} from '@/lib/data/airtable-client';

const TABLE = process.env.AIRTABLE_CREATIVE_STUDIO_TABLE ?? 'Creative Studio';

type MemoryRow = {
  payload: string;
  organizationId: string;
  title?: string;
  updatedAt: string;
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
    const saved = await airtableUpsertByField(
      TABLE,
      'Record Key',
      key,
      {
        'Record Key': key,
        'Record Type': RECORD_TYPE_LABEL[input.recordType],
        'Organization ID': input.organizationId,
        Title: input.title ?? input.id,
        'Payload JSON': payload,
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
    return JSON.parse(raw) as T;
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

    const parsed = JSON.parse(raw) as T;
    studioMemory().set(key, {
      payload: raw,
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

    const fromAirtable = records
      .map((record) => {
        const raw = record.fields?.['Payload JSON'];
        const recordKey = String(record.fields?.['Record Key'] ?? '');
        if (typeof raw !== 'string' || !recordKey) return null;
        studioMemory().set(recordKey, {
          payload: raw,
          organizationId,
          title: String(record.fields?.Title ?? ''),
          updatedAt: String(record.fields?.['Updated At'] ?? ''),
        });
        try {
          return JSON.parse(raw) as T;
        } catch {
          return null;
        }
      })
      .filter((row): row is T => row !== null);

    return fromAirtable.length ? fromAirtable : fromMemory;
  } catch (err) {
    console.error('[creative-studio] Airtable list failed:', err);
    return fromMemory;
  }
}
