import { NextRequest, NextResponse } from 'next/server';
import {
  adminAuthJsonError,
  requireAdminActionFromRequest,
  requireAdminSessionFromRequest,
} from '@/lib/admin-session-guard';
import {
  activeModuleIdsFromEntitlements,
  listEntitlementsForOrg,
  setModuleEnabled,
  setModulesEnabledBulk,
} from '@/lib/entitlements';
import { getCapabilityByModuleId } from '@/lib/experience-registry';
import type { ModuleId } from '@/lib/modules/registry';
import { MODULE_IDS, MODULE_REGISTRY } from '@/lib/modules/registry';
import { platformStoreConfigured } from '@/lib/platform-store';
import { isSyntheticOrganizationId } from '@/lib/tenant-context';
import { getMapRowByModuleId } from '@ea/capability-registry';

export const dynamic = 'force-dynamic';

function buildModuleRows(
  entitlements: Awaited<ReturnType<typeof listEntitlementsForOrg>>,
) {
  const active = activeModuleIdsFromEntitlements(entitlements);
  return MODULE_REGISTRY.map((mod) => {
    const experience = getCapabilityByModuleId(mod.id);
    const mapRow = getMapRowByModuleId(mod.id);
    const entitlement = entitlements.find((row) => row.moduleId === mod.id) ?? null;
    const platformCapabilityId = mapRow?.capabilityId ?? null;
    const experienceCapabilityId = experience?.id ?? null;
    const mapStatus: 'mapped' | 'unmapped' | 'partial' = !mapRow
      ? 'unmapped'
      : experienceCapabilityId &&
          platformCapabilityId &&
          experienceCapabilityId !== platformCapabilityId &&
          experienceCapabilityId !== mapRow.experienceCapabilityId
        ? 'partial'
        : 'mapped';

    return {
      moduleId: mod.id,
      name: mod.name,
      title: mod.title,
      description: mod.description,
      requiredRole: mod.requiredRole,
      navGroup: mod.navGroup,
      capabilityId: platformCapabilityId ?? experienceCapabilityId,
      capabilityLabel: experience?.displayLabel ?? mapRow?.capabilityId ?? mod.name,
      platformCapabilityId,
      experienceCapabilityId,
      enableKey: mapRow?.enableKey ?? null,
      hubModuleId: mapRow?.hubModuleId ?? null,
      mapStatus,
      enabled: active.has(mod.id),
      entitlement,
    };
  });
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminSessionFromRequest(req);
  if (!auth.ok) return adminAuthJsonError(auth);

  const orgId = req.nextUrl.searchParams.get('organizationId')?.trim();
  if (!orgId) {
    return NextResponse.json({ error: 'organizationId is required.' }, { status: 400 });
  }

  const entitlements = await listEntitlementsForOrg(orgId);
  const modules = buildModuleRows(entitlements);
  const enabledCount = modules.filter((m) => m.enabled).length;
  const mappedCount = modules.filter((m) => m.mapStatus === 'mapped').length;
  const unmappedCount = modules.filter((m) => m.mapStatus === 'unmapped').length;
  const partialCount = modules.filter((m) => m.mapStatus === 'partial').length;

  return NextResponse.json({
    organizationId: orgId,
    entitlements,
    modules,
    summary: {
      moduleCount: modules.length,
      enabledCount,
      mappedCount,
      unmappedCount,
      partialCount,
      entitlementRowCount: entitlements.length,
    },
    storeConfigured: platformStoreConfigured(),
    isSynthetic: isSyntheticOrganizationId(orgId),
    writable: platformStoreConfigured() && !isSyntheticOrganizationId(orgId),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) return adminAuthJsonError(auth);

  let body: {
    organizationId?: string;
    moduleId?: string;
    moduleIds?: string[];
    enabled?: boolean;
    action?: 'set' | 'bulk-enable' | 'bulk-disable' | 'enable-all' | 'disable-all' | 'enable-mapped';
    source?: 'manual' | 'package' | 'subscription' | 'trial';
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const organizationId = body.organizationId?.trim();
  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId is required.' }, { status: 400 });
  }

  if (isSyntheticOrganizationId(organizationId) || !platformStoreConfigured()) {
    return NextResponse.json(
      { error: 'Entitlements are read-only for synthetic orgs or when Airtable is not configured.' },
      { status: 403 },
    );
  }

  const source = body.source ?? 'manual';
  const action = body.action ?? 'set';

  if (action === 'set') {
    const moduleId = body.moduleId?.trim() as ModuleId | undefined;
    if (!moduleId) {
      return NextResponse.json({ error: 'moduleId is required for set.' }, { status: 400 });
    }
    if (!(MODULE_IDS as readonly string[]).includes(moduleId)) {
      return NextResponse.json({ error: 'Unknown moduleId.' }, { status: 400 });
    }

    const entitlement = await setModuleEnabled(
      organizationId,
      moduleId,
      body.enabled !== false,
      source,
    );
    if (!entitlement) {
      return NextResponse.json(
        { error: 'Could not update entitlement. Check Airtable Entitlements table.' },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true, entitlement });
  }

  let targetIds: ModuleId[] = [];
  if (action === 'enable-all' || action === 'disable-all') {
    targetIds = [...MODULE_IDS];
  } else if (action === 'enable-mapped') {
    targetIds = MODULE_REGISTRY.map((m) => m.id).filter((id) => Boolean(getMapRowByModuleId(id)));
  } else if (action === 'bulk-enable' || action === 'bulk-disable') {
    const requested = (body.moduleIds ?? [])
      .map((id) => id.trim())
      .filter((id): id is ModuleId => (MODULE_IDS as readonly string[]).includes(id));
    if (!requested.length) {
      return NextResponse.json({ error: 'moduleIds required for bulk actions.' }, { status: 400 });
    }
    targetIds = requested;
  } else {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }

  const enabled =
    action === 'bulk-enable' || action === 'enable-all' || action === 'enable-mapped';
  const result = await setModulesEnabledBulk(organizationId, targetIds, enabled, source);

  return NextResponse.json({
    ok: result.failed.length === 0,
    action,
    enabled,
    updated: result.ok,
    failed: result.failed,
    updatedCount: result.ok.length,
    failedCount: result.failed.length,
  });
}
