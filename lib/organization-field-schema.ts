/**
 * Organizations Airtable schema helpers — discover + optionally create workspace columns.
 * Live Payments base historically only has Name / Slug / Status / Owner Email / Organization Id.
 */
import {
  AIRTABLE_BASE_ID,
  airtableAuthHeaders,
  airtableConfigured,
} from '@/lib/data/airtable-client';
import { ORGANIZATIONS_TABLE } from '@/lib/platform-store';
import { ORGANIZATION_WORKSPACE_FIELDS } from '@/lib/organization-workspace-fields';

type CachedSchema = {
  tableId: string;
  fieldNames: Set<string>;
  loadedAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: CachedSchema | null = null;
let ensureAttempted = false;

async function fetchOrganizationsSchema(): Promise<CachedSchema | null> {
  if (!airtableConfigured()) return null;
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`, {
    headers: airtableAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) {
    console.warn('[organizations-schema] meta tables failed:', res.status, await res.text());
    return null;
  }
  const json = (await res.json()) as {
    tables?: Array<{ id: string; name: string; fields?: Array<{ name: string }> }>;
  };
  const table = (json.tables || []).find(
    (t) => t.name === ORGANIZATIONS_TABLE || t.name.toLowerCase() === 'organizations',
  );
  if (!table) return null;
  return {
    tableId: table.id,
    fieldNames: new Set((table.fields || []).map((f) => f.name)),
    loadedAt: Date.now(),
  };
}

export async function getOrganizationFieldNames(force = false): Promise<Set<string> | null> {
  if (!force && cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
    return cache.fieldNames;
  }
  const next = await fetchOrganizationsSchema();
  if (!next) return cache?.fieldNames ?? null;
  cache = next;
  return next.fieldNames;
}

/** Best-effort: create missing single-line workspace columns (requires schema.bases:write). */
export async function ensureOrganizationWorkspaceFields(): Promise<{
  ok: boolean;
  created: string[];
  existing: string[];
  missing: string[];
  error?: string;
}> {
  if (!airtableConfigured()) {
    return { ok: false, created: [], existing: [], missing: [...ORGANIZATION_WORKSPACE_FIELDS], error: 'Airtable not configured' };
  }
  if (ensureAttempted && cache) {
    const existing = [...ORGANIZATION_WORKSPACE_FIELDS].filter((f) => cache!.fieldNames.has(f));
    const missing = [...ORGANIZATION_WORKSPACE_FIELDS].filter((f) => !cache!.fieldNames.has(f));
    return { ok: missing.length === 0, created: [], existing, missing };
  }
  ensureAttempted = true;

  const schema = await fetchOrganizationsSchema();
  if (!schema) {
    return {
      ok: false,
      created: [],
      existing: [],
      missing: [...ORGANIZATION_WORKSPACE_FIELDS],
      error: 'Could not load Organizations schema',
    };
  }
  cache = schema;

  const created: string[] = [];
  const existing = [...ORGANIZATION_WORKSPACE_FIELDS].filter((f) => schema.fieldNames.has(f));
  const toCreate = [...ORGANIZATION_WORKSPACE_FIELDS].filter((f) => !schema.fieldNames.has(f));

  for (const name of toCreate) {
    const res = await fetch(
      `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables/${schema.tableId}/fields`,
      {
        method: 'POST',
        headers: airtableAuthHeaders(),
        body: JSON.stringify({ name, type: 'singleLineText' }),
      },
    );
    if (res.ok) {
      created.push(name);
      schema.fieldNames.add(name);
    } else {
      const text = await res.text();
      // Permission or duplicate — stop creating; callers filter writes.
      console.warn(`[organizations-schema] create field "${name}" failed:`, res.status, text);
      break;
    }
  }

  cache = { ...schema, loadedAt: Date.now() };
  const missing = [...ORGANIZATION_WORKSPACE_FIELDS].filter((f) => !schema.fieldNames.has(f));
  return {
    ok: missing.length === 0,
    created,
    existing: [...existing, ...created],
    missing,
  };
}

/** Keep only fields that exist on the live Organizations table. */
export async function filterExistingOrganizationFields(
  fields: Record<string, string>,
): Promise<{ fields: Record<string, string>; skipped: string[] }> {
  await ensureOrganizationWorkspaceFields();
  const names = await getOrganizationFieldNames();
  if (!names) {
    // Fail closed on optional workspace columns when schema unknown.
    const allowedCore = new Set(['Name', 'Slug', 'Status', 'Owner Email', 'Organization Id']);
    const next: Record<string, string> = {};
    const skipped: string[] = [];
    for (const [k, v] of Object.entries(fields)) {
      if (allowedCore.has(k)) next[k] = v;
      else skipped.push(k);
    }
    return { fields: next, skipped };
  }
  const next: Record<string, string> = {};
  const skipped: string[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (names.has(k)) next[k] = v;
    else skipped.push(k);
  }
  return { fields: next, skipped };
}
