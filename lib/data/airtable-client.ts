/**
 * Unified Airtable client for EA platform data access.
 * New stores should use this module — not inline fetch + authHeaders.
 */

const BASE_URL = 'https://api.airtable.com/v0';

export const AIRTABLE_BASE_ID =
  process.env.AIRTABLE_PAYMENTS_BASE_ID?.trim() || 'appv0YoLIMY45fmDA';

export type AirtableRecord = {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
};

export function airtableConfigured(): boolean {
  const key = (process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT)?.trim();
  return Boolean(key && AIRTABLE_BASE_ID);
}

export function airtableAuthHeaders(): Record<string, string> {
  const key = (process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT)?.trim();
  if (!key) throw new Error('AIRTABLE_API_KEY not configured.');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

/** Escape single quotes for Airtable filterByFormula string literals. */
export function escapeAirtableString(value: string): string {
  return value.replace(/'/g, "\\'");
}

export type AirtableQueryOptions = {
  filterByFormula?: string;
  maxRecords?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
};

export async function airtableQuery(
  table: string,
  options: AirtableQueryOptions = {},
): Promise<AirtableRecord[]> {
  const url = new URL(`${BASE_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`);
  if (options.filterByFormula) {
    url.searchParams.set('filterByFormula', options.filterByFormula);
  }
  url.searchParams.set('maxRecords', String(options.maxRecords ?? 100));
  if (options.sortField) {
    url.searchParams.set('sort[0][field]', options.sortField);
    url.searchParams.set('sort[0][direction]', options.sortDirection ?? 'desc');
  }

  const res = await fetch(url.toString(), {
    headers: airtableAuthHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404 || text.includes('INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND')) {
      return [];
    }
    throw new Error(`airtableQuery ${table} ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { records?: AirtableRecord[] };
  return data.records ?? [];
}

export async function airtableCreate(
  table: string,
  fields: Record<string, unknown>,
  typecast = false,
): Promise<AirtableRecord | null> {
  const res = await fetch(`${BASE_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: airtableAuthHeaders(),
    body: JSON.stringify({ records: [{ fields }], typecast }),
  });

  if (!res.ok) {
    console.error(`airtableCreate ${table} failed:`, await res.text());
    return null;
  }

  const data = (await res.json()) as { records?: AirtableRecord[] };
  return data.records?.[0] ?? null;
}

export async function airtableUpdate(
  table: string,
  recordId: string,
  fields: Record<string, unknown>,
  typecast = false,
): Promise<AirtableRecord | null> {
  const res = await fetch(
    `${BASE_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}/${recordId}`,
    {
      method: 'PATCH',
      headers: airtableAuthHeaders(),
      body: JSON.stringify({ fields, typecast }),
    },
  );

  if (!res.ok) {
    console.error(`airtableUpdate ${table} failed:`, await res.text());
    return null;
  }

  return res.json() as Promise<AirtableRecord>;
}

export async function airtableUpsertByField(
  table: string,
  lookupField: string,
  lookupValue: string,
  fields: Record<string, unknown>,
  typecast = true,
): Promise<AirtableRecord | null> {
  if (!airtableConfigured()) return null;

  const formula = `{${lookupField}}='${escapeAirtableString(lookupValue)}'`;
  const existing = await airtableQuery(table, { filterByFormula: formula, maxRecords: 1 });
  const recordId = existing[0]?.id;

  if (recordId) {
    return airtableUpdate(table, recordId, fields, typecast);
  }
  return airtableCreate(table, fields, typecast);
}
