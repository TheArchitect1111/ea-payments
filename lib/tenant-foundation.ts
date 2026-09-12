/**
 * Shared org + package entitlements for every provision path.
 * Keeps CTP, phone show, and commerce fulfillment on one foundation.
 */
import { ensureOrganizationForPortal } from '@/lib/organizations';
import { ensurePackageEntitlements } from '@/lib/modules/portal-modules';
import { requireClientFactoryAssembly } from '@/lib/modules/client-factory-assembly';
import {
  buildAssemblyEvidenceReceipt,
  persistAssemblyEvidenceReceipt,
  type AssemblyEvidenceReceipt,
} from '@/lib/modules/assembly-evidence';
import capabilityCertifications from '@/config/capability-certifications.json';
import { listOsCapabilitiesByLifecycle } from '@/lib/os-capability-taxonomy';
import type { OsLifecycleTag } from '@/lib/os-lifecycle';

export type TenantFoundationInput = {
  portalSlug: string;
  clientName: string;
  organizationName?: string;
  clientRecordId?: string;
  packagePurchased: string;
  commerceOfferId?: string;
  /** Explicit override. Fully certified Starter provisioning defaults to certified mode. */
  assemblyMode?: 'legacy' | 'certified';
  requestedModuleIds?: readonly string[];
};

export type TenantFoundationResult = {
  orgId: string;
  assemblyEvidence?: AssemblyEvidenceReceipt;
};

/** Light taxonomy hook — foundation sits at organize + communicate readiness. */
function touchOsFoundationTaxonomy(): void {
  const tags: OsLifecycleTag[] = ['organize', 'communicate'];
  for (const tag of tags) {
    void listOsCapabilitiesByLifecycle(tag);
  }
}

function effectiveAssemblyMode(input: TenantFoundationInput): 'legacy' | 'certified' {
  if (input.assemblyMode) return input.assemblyMode;
  return input.packagePurchased === 'Website + Portal Starter' ? 'certified' : 'legacy';
}

export async function ensureTenantFoundation(
  input: TenantFoundationInput,
): Promise<TenantFoundationResult> {
  touchOsFoundationTaxonomy();

  const assemblyMode = effectiveAssemblyMode(input);
  const assemblyPlan = assemblyMode === 'certified'
    ? requireClientFactoryAssembly({
        packagePurchased: input.packagePurchased,
        requestedModuleIds: input.requestedModuleIds,
      })
    : null;

  // Certified preflight intentionally runs before any organization or entitlement write.
  // Packages that are not fully certified retain legacy behavior unless explicitly requested.
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
    if (assemblyMode === 'certified') throw err;
  }

  if (!assemblyPlan) return { orgId };

  const assemblyEvidence = buildAssemblyEvidenceReceipt({
    portalSlug: input.portalSlug,
    organizationId: orgId,
    packagePurchased: input.packagePurchased,
    plan: assemblyPlan,
    certificationRun: capabilityCertifications.run,
  });
  await persistAssemblyEvidenceReceipt(assemblyEvidence);

  return { orgId, assemblyEvidence };
}
