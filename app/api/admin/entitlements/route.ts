import { loadTenantInstall, persistTenantInstall } from '@/lib/modules/tenant-install';
import { CHASSIS_STANDARD_MODULE_IDS } from '@/lib/modules/registry';
import { createAssemblyPlan } from '@/lib/modules/assembly';
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
import {
  BUSINESS_OPTION_CATALOG,
  businessOptionEnabled,
  getBusinessOption,
} from '@/lib/modules/business-options';

export const dynamic = 'force-dynamic';
async function retainInstalledSelection(organizationId: string, changed: readonly ModuleId[], enabled: boolean) {
  const install = await loadTenantInstall(organizationId);
  if (!install) return;
  const next = new Set(install.admitted);
  for (const id of changed) { if (enabled) next.add(id); else next.delete(id); }
  const plan = createAssemblyPlan([...next]);
  if (plan.blocked) throw new Error('Updated installation is not certified');
  const active = activeModuleIdsFromEntitlements(await listEntitlementsForOrg(organizationId));
  if (plan.admitted.some(id => !active.has(id))) throw new Error('Selection write was not confirmed');
  await persistTenantInstall({ ...install, admitted: plan.admitted, requested: [...next] });
}


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
      assembly: createAssemblyPlan([mod.id]),
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
    businessOptions: BUSINESS_OPTION_CATALOG.map((option) => ({
      ...option,
      enabled: businessOptionEnabled(option, activeModuleIdsFromEntitlements(entitlements)),
    })),
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
    businessOptionId?: string;
    enabled?: boolean;
    action?:
      | 'set'
      | 'set-business-option'
      | 'bulk-enable'
      | 'bulk-disable'
      | 'enable-all'
      | 'disable-all'
      | 'enable-mapped';
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

    if (body.enabled === false && (CHASSIS_STANDARD_MODULE_IDS as readonly string[]).includes(moduleId))
      return NextResponse.json({ error: 'Standard chassis modules cannot be disabled' }, { status: 409 });
    if (body.enabled !== false) {
      const plan = createAssemblyPlan([moduleId]);
      if (plan.blocked) return NextResponse.json({ error: 'Selection is not certified', rejected: plan.rejected }, { status: 409 });
    }
    if (body.enabled !== false) {
      const admitted = createAssemblyPlan([moduleId]).admitted;
      const result = await setModulesEnabledBulk(organizationId, admitted, true, source);
      if (result.failed.length) return NextResponse.json({ ok: false, updated: result.ok, failed: result.failed }, { status: 503 });
      const actual = await listEntitlementsForOrg(organizationId);
      if (admitted.some(id => !activeModuleIdsFromEntitlements(actual).has(id)))
        return NextResponse.json({ error: 'Selection read-back failed' }, { status: 503 });
      await retainInstalledSelection(organizationId, admitted, true);
      return NextResponse.json({ ok: true, entitlement: actual.find(e => e.moduleId === moduleId), admitted });
    }
    const entitlement = await setModuleEnabled(organizationId, moduleId, false, source);
    if (!entitlement) {
      return NextResponse.json(
        { error: 'Could not update entitlement. Check Airtable Entitlements table.' },
        { status: 503 },
      );
    }
    await retainInstalledSelection(organizationId, [moduleId], false);
    return NextResponse.json({ ok: true, entitlement });
  }

  if (action === 'set-business-option') {
    const option = getBusinessOption(body.businessOptionId?.trim() ?? '');
    if (!option) {
      return NextResponse.json({ error: 'Unknown businessOptionId.' }, { status: 400 });
    }
    const enabled = body.enabled !== false;
    const plan = createAssemblyPlan([...option.moduleIds]);
    if (enabled && plan.blocked) return NextResponse.json({ error: 'Selection is not certified', rejected: plan.rejected }, { status: 409 });
    const result = await setModulesEnabledBulk(
      organizationId,
      enabled ? plan.admitted : [...option.moduleIds],
      enabled,
      source,
    );
    if (!result.failed.length) await retainInstalledSelection(organizationId, enabled ? plan.admitted : option.moduleIds, enabled);
    return NextResponse.json({
      ok: result.failed.length === 0,
      action,
      businessOptionId: option.id,
      enabled,
      updated: result.ok,
      failed: result.failed,
      updatedCount: result.ok.length,
      failedCount: result.failed.length,
    });
  }

  let targetIds: ModuleId[] = [];
  if (action === 'enable-all' || action === 'disable-all') {
    targetIds = [...MODULE_IDS];
  } else if (action === 'enable-mapped') {
    targetIds = MODULE_REGISTRY.map((m) => m.id).filter((id) => Boolean(getMapRowByModuleId(id)));
  } else if (action === 'bulk-enable' || action === 'bulk-disable') {
    if ((body.moduleIds ?? []).some(id => !(MODULE_IDS as readonly string[]).includes(id.trim())))
      return NextResponse.json({ error: 'Unknown moduleId in selection.' }, { status: 400 });
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
  if (!enabled && targetIds.some(id => (CHASSIS_STANDARD_MODULE_IDS as readonly string[]).includes(id)))
    return NextResponse.json({ error: 'Standard chassis modules cannot be disabled' }, { status: 409 });
  const plan = createAssemblyPlan(targetIds);
  if (enabled && plan.blocked) return NextResponse.json({ error: 'Selection is not certified', rejected: plan.rejected }, { status: 409 });
  const result = await setModulesEnabledBulk(organizationId, enabled ? plan.admitted : targetIds, enabled, source);
  if (!result.failed.length) await retainInstalledSelection(organizationId, enabled ? plan.admitted : targetIds, enabled);

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
