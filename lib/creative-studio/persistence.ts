const BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID;
const TABLE = process.env.AIRTABLE_CREATIVE_STUDIO_TABLE ?? 'Creative Studio';

const memory = new Map<string, { payload: string; organizationId: string; title?: string; updatedAt: string }>();

function authHeaders(): Record<string, string> {
  const key = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT;
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

function airtableReady(): boolean {
  return Boolean((process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT) && BASE_ID);
}

export function studioRecordKey(recordType: 'campaign' | 'brand', id: string): string {
  return `${recordType}:${id}`;
}

export async function saveStudioRecord(input: {
  recordType: 'campaign' | 'brand';
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

  if (!airtableReady()) return;

  const fields = {
    'Record Key': key,
    'Record Type': input.recordType === 'campaign' ? 'Campaign' : 'Brand',
    'Organization ID': input.organizationId,
    Title: input.title ?? input.id,
    'Payload JSON': payload,
    'Updated At': updatedAt,
  };

  try {
    const formula = encodeURIComponent(`{Record Key}='${key.replace(/'/g, "\\'")}'`);
    const lookup = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?filterByFormula=${formula}&maxRecords=1`,
      { headers: authHeaders(), cache: 'no-store' },
    );
    if (!lookup.ok) return;

    const existing = (await lookup.json()) as { records?: { id: string }[] };
    const recordId = existing.records?.[0]?.id;

    if (recordId) {
      await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${recordId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ fields, typecast: true }),
      });
    } else {
      await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      });
    }
  } catch (err) {
    console.error('[creative-studio] Airtable save failed:', err);
  }
}

export async function loadStudioRecord<T>(
  recordType: 'campaign' | 'brand',
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

  if (!airtableReady()) return null;

  try {
    const formula = encodeURIComponent(`{Record Key}='${key.replace(/'/g, "\\'")}'`);
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?filterByFormula=${formula}&maxRecords=1`,
      { headers: authHeaders(), cache: 'no-store' },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      records?: { fields?: Record<string, unknown> }[];
    };
    const raw = data.records?.[0]?.fields?.['Payload JSON'];
    if (typeof raw !== 'string' || !raw.trim()) return null;

    const parsed = JSON.parse(raw) as T;
    memory.set(key, {
      payload: raw,
      organizationId: String(data.records?.[0]?.fields?.['Organization ID'] ?? 'ea'),
      title: String(data.records?.[0]?.fields?.Title ?? ''),
      updatedAt: String(data.records?.[0]?.fields?.['Updated At'] ?? new Date().toISOString()),
    });
    return parsed;
  } catch (err) {
    console.error('[creative-studio] Airtable load failed:', err);
    return null;
  }
}

export async function listStudioRecords<T>(
  recordType: 'campaign' | 'brand',
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

  if (!airtableReady()) return fromMemory;

  try {
    const formula = encodeURIComponent(
      `AND({Record Type}='${recordType === 'campaign' ? 'Campaign' : 'Brand'}',{Organization ID}='${organizationId.replace(/'/g, "\\'")}')`,
    );
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?filterByFormula=${formula}&maxRecords=100&sort%5B0%5D%5Bfield%5D=Updated%20At&sort%5B0%5D%5Bdirection%5D=desc`,
      { headers: authHeaders(), cache: 'no-store' },
    );
    if (!res.ok) return fromMemory;

    const data = (await res.json()) as {
      records?: { fields?: Record<string, unknown> }[];
    };

    const fromAirtable = (data.records ?? [])
      .map((record) => {
        const raw = record.fields?.['Payload JSON'];
        const key = String(record.fields?.['Record Key'] ?? '');
        if (typeof raw !== 'string' || !key) return null;
        memory.set(key, {
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
