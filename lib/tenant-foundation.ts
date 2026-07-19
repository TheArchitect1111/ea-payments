/**
 * Shared org + package entitlements for every provision path.
 * Keeps CTP, phone show, and commerce fulfillment on one foundation.
 */
import { ensureOrganizationForPortal } from '@/lib/organizations';
import { ensurePackageEntitlements } from '@/lib/modules/portal-modules';
import { listOsCapabilitiesByLifecycle } from '@/lib/os-capability-taxonomy';
import type { OsLifecycleTag } from '@/lib/os-lifecycle';

export type TenantFoundationInput = {
  portalSlug: string;
  clientName: string;
  organizationName?: string;
  clientRecordId?: string;
  packagePurchased: string;
  commerceOfferId?: string;
};

/** Light taxonomy hook — foundation sits at organize + communicate readiness. */
function touchOsFoundationTaxonomy(): void {
  const tags: OsLifecycleTag[] = ['organize', 'communicate'];
  for (const tag of tags) {
    void listOsCapabilitiesByLifecycle(tag);
  }
}

export async function ensureTenantFoundation(
  input: TenantFoundationInput,
): Promise<{ orgId: string }> {
  touchOsFoundationTaxonomy();

  const { orgId } = await ensureOrganizationForPortal({
    portalSlug: input.portalSlug,
    name: input.clientName,
    clientRecordId: input.clientRecordId,
    organizationName: input.organizationName ?? input.clientName,
  });

  try {
    await ensurePackageEntitlements({
      orgId,
      packagePurchased: input.packagePurchased,
      commerceOfferId: input.commerceOfferId,
      slug: input.portalSlug,
    });
  } catch (err) {
    console.error('[tenant-foundation] ensurePackageEntitlements failed:', err);
  }

  return { orgId };
}
