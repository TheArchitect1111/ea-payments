/**
 * Package entitlement sync — safe to import from server modules that must not
 * pull `next/headers` (cookies) into client bundles.
 */
import {
  listEntitlementsForOrg,
  syncPackageEntitlements,
} from '@/lib/entitlements';
import { resolveEntitlementPackageKey } from '@/lib/modules/entitlement-package-key';
import { loadTenantInstall } from './tenant-install';
import { requireAssemblyPlan } from './assembly';
import type { ModuleId } from './registry';
import { defaultModulesForPackage } from '@/lib/modules/registry';

const DEMO_SLUGS = new Set(['demo-client', 'demo-website']);

export function isDemoPortalSlug(slug: string): boolean {
  return DEMO_SLUGS.has(slug);
}

/** Ensure package entitlements are persisted when org tables exist. */
export async function ensurePackageEntitlements(input: {
  orgId: string;
  packagePurchased: string;
  commerceOfferId?: string;
  slug: string;
  admittedModuleIds?: readonly ModuleId[];
}): Promise<void> {
  if (input.orgId.startsWith('org_')) {
    if (input.admittedModuleIds) throw new Error('Certified installation requires a persisted organization');
    return;
  }

  const packageKey = resolveEntitlementPackageKey(input);
  const installed = await loadTenantInstall(input.orgId);
  if (installed && installed.portalSlug !== input.slug) throw new Error('Installation tenant mismatch');
  const selected = input.admittedModuleIds ?? installed?.admitted;
  const moduleIds = selected ? [...new Set(selected)] : defaultModulesForPackage(packageKey, {
    isDemo: isDemoPortalSlug(input.slug),
  });
  if (selected) {
    const checked = requireAssemblyPlan(moduleIds);
    if (checked.admitted.length !== new Set(moduleIds).size) throw new Error('Selection omits required chassis modules');
  }
  const desired = new Set(moduleIds);
  const existing = await listEntitlementsForOrg(input.orgId);
  const activePackage = new Set(
    existing
      .filter((e) => e.source === 'package' && (e.status === 'active' || e.status === 'trial'))
      .map((e) => e.moduleId),
  );
  const alreadyMatched =
    desired.size === activePackage.size && [...desired].every((id) => activePackage.has(id));

  if (alreadyMatched) return;

  await syncPackageEntitlements(input.orgId, moduleIds);
  if (selected) {
    const actual = new Set((await listEntitlementsForOrg(input.orgId))
      .filter(e => e.source === 'package' && (e.status === 'active' || e.status === 'trial')).map(e => e.moduleId));
    if (actual.size !== desired.size || [...desired].some(id => !actual.has(id)))
      throw new Error('Admitted entitlement read-back mismatch');
  }
}
