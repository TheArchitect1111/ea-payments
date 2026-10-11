import { loadStudioRecordFromAirtable } from '@/lib/creative-studio/persistence';
/**
 * Shared org + package entitlements for every provision path.
 * Keeps CTP, phone show, and commerce fulfillment on one foundation.
 */
import { ensureOrganizationForPortal } from '@/lib/organizations';
import { ensurePackageEntitlements } from '@/lib/modules/ensure-package-entitlements';
import { persistTenantInstall, type TenantInstall } from '@/lib/modules/tenant-install';
import { installSelectedBricks, type BrickSelection } from '@/lib/portal-universal/bricks/registry';
import { updateOrganizationWorkspaceConfig } from '@/lib/organizations';
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
  businessOptionIds?: readonly string[];
  industryPackId?: string;
  bricks?: readonly BrickSelection[];
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
  const explicitSelection = !!(input.requestedModuleIds || input.businessOptionIds || input.industryPackId || input.bricks);
  if (explicitSelection && input.assemblyMode === 'legacy') throw new Error('Explicit selection requires certified installation');
  if (explicitSelection) return 'certified';
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
        commerceOfferId: input.commerceOfferId,
        requestedModuleIds: input.requestedModuleIds,
        businessOptionIds: input.businessOptionIds,
        industryPackId: input.industryPackId,
        bricks: input.bricks,
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

  const installation: TenantInstall | undefined = assemblyPlan ? {
    version: 1, organizationId: orgId, portalSlug: input.portalSlug,
    requested: assemblyPlan.requested, admitted: assemblyPlan.admitted,
    industryPackId: input.industryPackId, brickIds: (input.bricks ?? []).map(b => b.id), state: 'installing',
  } : undefined;
  if (installation) await persistTenantInstall(installation);
  try {
    await ensurePackageEntitlements({
      orgId,
      packagePurchased: input.packagePurchased,
      commerceOfferId: input.commerceOfferId,
      slug: input.portalSlug,
      admittedModuleIds: assemblyPlan?.admitted,
    });
  } catch (err) {
    console.error('[tenant-foundation] ensurePackageEntitlements failed:', err);
    if (assemblyMode === 'certified') throw err;
  }

  if (!assemblyPlan) return { orgId };

  await installSelectedBricks({ organizationId: orgId, portalSlug: input.portalSlug }, input.bricks);
  if (input.industryPackId) {
    const updated = await updateOrganizationWorkspaceConfig(orgId, { industryPackId: input.industryPackId });
    const durable = await loadStudioRecordFromAirtable<{ industryPackId?: string }>('brand', `org-workspace-${orgId}`);
    if (!updated || durable?.industryPackId !== input.industryPackId) throw new Error('Industry pack write failed');
  }
  const assemblyEvidence = buildAssemblyEvidenceReceipt({
    portalSlug: input.portalSlug,
    organizationId: orgId,
    packagePurchased: input.packagePurchased,
    plan: assemblyPlan,
    certificationRun: capabilityCertifications.run,
  });
  await persistAssemblyEvidenceReceipt(assemblyEvidence);

  await persistTenantInstall({ ...installation!, state: 'installed' });
  return { orgId, assemblyEvidence };
}
