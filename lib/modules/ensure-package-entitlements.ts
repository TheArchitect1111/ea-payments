/**
 * Package entitlement sync — safe to import from server modules that must not
 * pull `next/headers` (cookies) into client bundles.
 */
import {
  listEntitlementsForOrg,
  syncPackageEntitlements,
} from '@/lib/entitlements';
import { resolveEntitlementPackageKey } from '@/lib/modules/entitlement-package-key';
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
}): Promise<void> {
  if (input.orgId.startsWith('org_')) return;

  const packageKey = resolveEntitlementPackageKey(input);
  const moduleIds = defaultModulesForPackage(packageKey, {
    isDemo: isDemoPortalSlug(input.slug),
  });
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
}
