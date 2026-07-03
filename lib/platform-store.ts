/**
 * Shared Airtable config for EA Platform Chassis identity tables.
 * Delegates transport to lib/data/airtable-client.ts.
 */

import {
  AIRTABLE_BASE_ID,
  airtableAuthHeaders,
  airtableConfigured,
  airtableCreate,
  airtableQuery,
  airtableUpdate,
  type AirtableRecord,
} from '@/lib/data/airtable-client';

export const PLATFORM_BASE_ID = AIRTABLE_BASE_ID;

export const ORGANIZATIONS_TABLE =
  process.env.AIRTABLE_ORGANIZATIONS_TABLE?.trim() || 'Organizations';

export const MEMBERSHIPS_TABLE =
  process.env.AIRTABLE_MEMBERSHIPS_TABLE?.trim() || 'Memberships';

export const EA_INTERNAL_ORG_ID =
  process.env.EA_INTERNAL_ORG_ID?.trim() || 'ea';

export type { AirtableRecord };

export function platformStoreConfigured(): boolean {
  return airtableConfigured();
}

export function authHeaders(): Record<string, string> {
  return airtableAuthHeaders();
}

export async function platformQuery(
  table: string,
  filterByFormula?: string,
  maxRecords = 100,
): Promise<AirtableRecord[]> {
  return airtableQuery(table, { filterByFormula, maxRecords });
}

export async function platformCreate(
  table: string,
  fields: Record<string, string | number | boolean>,
): Promise<AirtableRecord | null> {
  return airtableCreate(table, fields);
}

export async function platformUpdate(
  table: string,
  recordId: string,
  fields: Record<string, string | number | boolean>,
): Promise<AirtableRecord | null> {
  return airtableUpdate(table, recordId, fields);
}

export function escapeAirtableString(value: string): string {
  return value.toLowerCase().replace(/'/g, "\\'");
}

export function syntheticOrgId(portalSlug: string): string {
  return `org_${portalSlug}`;
}
