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
} from '@/lib/entitlements';
import { getCapabilityByModuleId } from '@/lib/experience-registry';
import type { ModuleId } from '@/lib/modules/registry';
import { MODULE_IDS, MODULE_REGISTRY } from '@/lib/modules/registry';
import { platformStoreConfigured } from '@/lib/platform-store';
import { isSyntheticOrganizationId } from '@/lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminSessionFromRequest(req);
  if (!auth.ok) return adminAuthJsonError(auth);

  const orgId = req.nextUrl.searchParams.get('organizationId')?.trim();
  if (!orgId) {
    return NextResponse.json({ error: 'organizationId is required.' }, { status: 400 });
  }

  const entitlements = await listEntitlementsForOrg(orgId);
  const active = activeModuleIdsFromEntitlements(entitlements);
  const modules = MODULE_REGISTRY.map((mod) => {
    const capability = getCapabilityByModuleId(mod.id);
    const entitlement = entitlements.find((row) => row.moduleId === mod.id) ?? null;
    return {
      moduleId: mod.id,
      name: mod.name,
      title: mod.title,
      description: mod.description,
      requiredRole: mod.requiredRole,
      capabilityId: capability?.id ?? null,
      capabilityLabel: capability?.displayLabel ?? mod.name,
      enabled: active.has(mod.id),
      entitlement,
    };
  });

  return NextResponse.json({
    organizationId: orgId,
    entitlements,
    modules,
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
    enabled?: boolean;
    source?: 'manual' | 'package' | 'subscription' | 'trial';
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const organizationId = body.organizationId?.trim();
  const moduleId = body.moduleId?.trim() as ModuleId | undefined;

  if (!organizationId || !moduleId) {
    return NextResponse.json({ error: 'organizationId and moduleId are required.' }, { status: 400 });
  }

  if (!(MODULE_IDS as readonly string[]).includes(moduleId)) {
    return NextResponse.json({ error: 'Unknown moduleId.' }, { status: 400 });
  }

  const entitlement = await setModuleEnabled(
    organizationId,
    moduleId,
    body.enabled !== false,
    body.source ?? 'manual',
  );

  if (!entitlement) {
    return NextResponse.json(
      { error: 'Could not update entitlement. Check Airtable Entitlements table.' },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, entitlement });
}
