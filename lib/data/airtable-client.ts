/**
 * Unified Airtable client for EA platform data access.
 * New stores should use this module — not inline fetch + authHeaders.
 */

const BASE_URL = 'https://api.airtable.com/v0';
const AIRTABLE_RETRY_LIMIT = 3;
const AIRTABLE_RATE_LIMIT_COOLDOWN_MS = 30_000;

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

function retryDelayMs(response: Response, attempt: number): number {
  const retryAfter = Number(response.headers.get('retry-after'));

  if (response.status === 429) {
    const serverDelay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 0;
    const jitter = Math.floor(Math.random() * 750);
    return Math.max(AIRTABLE_RATE_LIMIT_COOLDOWN_MS, serverDelay) + jitter;
  }

  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, 5000);
  return Math.min(250 * 2 ** attempt, 2000);
}

async function airtableFetch(url: string, init: RequestInit): Promise<Response> {
  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt < AIRTABLE_RETRY_LIMIT; attempt += 1) {
    const response = await fetch(url, init);
    lastResponse = response;
    if (response.status !== 429 && response.status < 500) return response;
    if (attempt === AIRTABLE_RETRY_LIMIT - 1) return response;
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs(response, attempt)));
  }
  if (!lastResponse) throw new Error('Airtable request did not execute.');
  return lastResponse;
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

  const res = await airtableFetch(url.toString(), {
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
  const res = await airtableFetch(`${BASE_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`, {
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
  const res = await airtableFetch(
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
