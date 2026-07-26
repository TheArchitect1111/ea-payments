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
  airtableUpsertByField,
  type AirtableRecord,
} from '@/lib/data/airtable-client';

export const PLATFORM_BASE_ID = AIRTABLE_BASE_ID;

export const ORGANIZATIONS_TABLE =
  process.env.AIRTABLE_ORGANIZATIONS_TABLE?.trim() || 'Organizations';

export const MEMBERSHIPS_TABLE =
  process.env.AIRTABLE_MEMBERSHIPS_TABLE?.trim() || 'Memberships';

export const EA_INTERNAL_ORG_ID =
  process.env.EA_INTERNAL_ORG_ID?.trim() || 'ea';

/**
 * People durable SoR is Postgres schema `people` (Phase 2C). Airtable People table
 * constants were quarantined under `lib/people/_quarantine_airtable_sor/` — do not
 * re-export them from the platform facade (INV-33).
 */

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

/**
 * Idempotent upsert keyed by an indexed lookup field — the platform pattern for
 * emulating a UNIQUE constraint (Creative Studio / CTP Submissions / People keys).
 * Returns `null` when Airtable is unconfigured or the write soft-failed; callers
 * that require durability must treat `null` as a dependency failure.
 */
export async function platformUpsertByField(
  table: string,
  lookupField: string,
  lookupValue: string,
  fields: Record<string, unknown>,
  typecast = true,
): Promise<AirtableRecord | null> {
  return airtableUpsertByField(table, lookupField, lookupValue, fields, typecast);
}

export function escapeAirtableString(value: string): string {
  return value.toLowerCase().replace(/'/g, "\\'");
}

export function syntheticOrgId(portalSlug: string): string {
  return `org_${portalSlug}`;
}
