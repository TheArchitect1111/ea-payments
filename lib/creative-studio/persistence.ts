import {
  airtableConfigured,
  airtableQuery,
  airtableUpsertByField,
  escapeAirtableString,
} from '@/lib/data/airtable-client';

const TABLE = process.env.AIRTABLE_CREATIVE_STUDIO_TABLE ?? 'Creative Studio';

const memory = new Map<string, { payload: string; organizationId: string; title?: string; updatedAt: string }>();

export function studioRecordKey(recordType: 'campaign' | 'brand' | 'media', id: string): string {
  return `${recordType}:${id}`;
}

const RECORD_TYPE_LABEL: Record<'campaign' | 'brand' | 'media', string> = {
  campaign: 'Campaign',
  brand: 'Brand',
  media: 'Media',
};

export async function saveStudioRecord(input: {
  recordType: 'campaign' | 'brand' | 'media';
  id: string;
  organizationId: string;
  payload: unknown;
  title?: string;
}): Promise<void> {
  const key = studioRecordKey(input.recordType, input.id);
  const updatedAt = new Date().toISOString();
  const payload = JSON.stringify(input.payload);
  memory.set(key, {
    payload,
    organizationId: input.organizationId,
    title: input.title,
    updatedAt,
  });

  if (!airtableConfigured()) return;

  try {
    await airtableUpsertByField(
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
  } catch (err) {
    console.error('[creative-studio] Airtable save failed:', err);
  }
}

export async function loadStudioRecord<T>(
  recordType: 'campaign' | 'brand' | 'media',
  id: string,
): Promise<T | null> {
  const key = studioRecordKey(recordType, id);
  const cached = memory.get(key);
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
    memory.set(key, {
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
  recordType: 'campaign' | 'brand' | 'media',
  organizationId: string,
): Promise<T[]> {
  const prefix = `${recordType}:`;
  const fromMemory = [...memory.entries()]
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
        memory.set(recordKey, {
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
