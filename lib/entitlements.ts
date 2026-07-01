import type { ModuleId } from '@/lib/modules/registry';
import {
  escapeAirtableString,
  platformCreate,
  platformQuery,
  platformStoreConfigured,
  platformUpdate,
  type AirtableRecord,
} from '@/lib/platform-store';

export const ENTITLEMENTS_TABLE =
  process.env.AIRTABLE_ENTITLEMENTS_TABLE?.trim() || 'Entitlements';

export type EntitlementStatus = 'active' | 'trial' | 'suspended';
export type EntitlementSource = 'subscription' | 'manual' | 'package' | 'trial';

export type Entitlement = {
  id: string;
  organizationId: string;
  moduleId: ModuleId;
  status: EntitlementStatus;
  source: EntitlementSource;
};

function mapEntitlement(record: AirtableRecord): Entitlement | null {
  const moduleId = String(record.fields['Module Id'] ?? '') as ModuleId;
  if (!moduleId) return null;

  return {
    id: record.id,
    organizationId: String(record.fields['Organization Id'] ?? ''),
    moduleId,
    status: (String(record.fields['Status'] ?? 'active').toLowerCase() as EntitlementStatus) || 'active',
    source: (String(record.fields['Source'] ?? 'manual').toLowerCase() as EntitlementSource) || 'manual',
  };
}

export async function listEntitlementsForOrg(organizationId: string): Promise<Entitlement[]> {
  if (!platformStoreConfigured() || organizationId.startsWith('org_')) {
    return [];
  }

  const orgId = organizationId.replace(/'/g, "\\'");
  const records = await platformQuery(
    ENTITLEMENTS_TABLE,
    `{Organization Id}='${orgId}'`,
    200,
  );

  return records.map(mapEntitlement).filter((e): e is Entitlement => e !== null);
}

export async function upsertEntitlement(input: {
  organizationId: string;
  moduleId: ModuleId;
  status: EntitlementStatus;
  source: EntitlementSource;
}): Promise<Entitlement | null> {
  if (!platformStoreConfigured() || input.organizationId.startsWith('org_')) {
    return null;
  }

  const orgId = input.organizationId.replace(/'/g, "\\'");
  const moduleId = escapeAirtableString(input.moduleId);
  const existing = await platformQuery(
    ENTITLEMENTS_TABLE,
    `AND({Organization Id}='${orgId}', LOWER({Module Id})='${moduleId}')`,
    1,
  );

  const fields = {
    'Organization Id': input.organizationId,
    'Module Id': input.moduleId,
    Status: input.status,
    Source: input.source,
  };

  if (existing[0]) {
    const updated = await platformUpdate(ENTITLEMENTS_TABLE, existing[0].id, fields);
    return updated ? mapEntitlement(updated) : null;
  }

  const created = await platformCreate(ENTITLEMENTS_TABLE, fields);
  return created ? mapEntitlement(created) : null;
}

export async function setModuleEnabled(
  organizationId: string,
  moduleId: ModuleId,
  enabled: boolean,
  source: EntitlementSource = 'manual',
): Promise<Entitlement | null> {
  return upsertEntitlement({
    organizationId,
    moduleId,
    status: enabled ? 'active' : 'suspended',
    source,
  });
}

/** Write package-derived entitlements after payment or login backfill. */
export async function syncPackageEntitlements(
  organizationId: string,
  moduleIds: ModuleId[],
): Promise<void> {
  if (!platformStoreConfigured() || organizationId.startsWith('org_')) return;

  await Promise.all(
    moduleIds.map((moduleId) =>
      upsertEntitlement({
        organizationId,
        moduleId,
        status: 'active',
        source: 'package',
      }),
    ),
  );
}

export function activeModuleIdsFromEntitlements(entitlements: Entitlement[]): Set<ModuleId> {
  const active = new Set<ModuleId>();
  for (const row of entitlements) {
    if (row.status === 'active' || row.status === 'trial') {
      active.add(row.moduleId);
    }
  }
  return active;
}

export function isModuleInSet(
  moduleId: ModuleId,
  enabled: Set<ModuleId>,
): boolean {
  return enabled.has(moduleId);
}
