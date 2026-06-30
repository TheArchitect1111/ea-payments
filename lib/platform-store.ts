/**
 * Shared Airtable config for EA Platform Chassis identity tables.
 */

const BASE_URL = 'https://api.airtable.com/v0';

export const PLATFORM_BASE_ID =
  process.env.AIRTABLE_PAYMENTS_BASE_ID?.trim() || 'appv0YoLIMY45fmDA';

export const ORGANIZATIONS_TABLE =
  process.env.AIRTABLE_ORGANIZATIONS_TABLE?.trim() || 'Organizations';

export const MEMBERSHIPS_TABLE =
  process.env.AIRTABLE_MEMBERSHIPS_TABLE?.trim() || 'Memberships';

export const EA_INTERNAL_ORG_ID =
  process.env.EA_INTERNAL_ORG_ID?.trim() || 'ea';

export type AirtableRecord = {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
};

export function platformStoreConfigured(): boolean {
  return Boolean(process.env.AIRTABLE_API_KEY?.trim());
}

export function authHeaders(): Record<string, string> {
  const key = process.env.AIRTABLE_API_KEY?.trim();
  if (!key) throw new Error('AIRTABLE_API_KEY not configured.');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

export async function platformQuery(
  table: string,
  filterByFormula?: string,
  maxRecords = 100,
): Promise<AirtableRecord[]> {
  const url = new URL(
    `${BASE_URL}/${PLATFORM_BASE_ID}/${encodeURIComponent(table)}`,
  );
  if (filterByFormula) {
    url.searchParams.set('filterByFormula', filterByFormula);
  }
  url.searchParams.set('maxRecords', String(maxRecords));

  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404 || text.includes('INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND')) {
      return [];
    }
    throw new Error(`platformQuery ${table} ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { records?: AirtableRecord[] };
  return data.records ?? [];
}

export async function platformCreate(
  table: string,
  fields: Record<string, string | number | boolean>,
): Promise<AirtableRecord | null> {
  const res = await fetch(
    `${BASE_URL}/${PLATFORM_BASE_ID}/${encodeURIComponent(table)}`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ fields }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`platformCreate ${table} failed:`, text);
    return null;
  }

  return res.json() as Promise<AirtableRecord>;
}

export async function platformUpdate(
  table: string,
  recordId: string,
  fields: Record<string, string | number | boolean>,
): Promise<AirtableRecord | null> {
  const res = await fetch(
    `${BASE_URL}/${PLATFORM_BASE_ID}/${encodeURIComponent(table)}/${recordId}`,
    {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ fields }),
    },
  );

  if (!res.ok) {
    console.error(`platformUpdate ${table} failed:`, await res.text());
    return null;
  }

  return res.json() as Promise<AirtableRecord>;
}

export function escapeAirtableString(value: string): string {
  return value.toLowerCase().replace(/'/g, "\\'");
}

export function syntheticOrgId(portalSlug: string): string {
  return `org_${portalSlug}`;
}
