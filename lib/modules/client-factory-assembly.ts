import { createAssemblyPlan, requireAssemblyPlan, type AssemblyPlan } from '@/lib/modules/assembly';
import { getBusinessOption } from './business-options';
import { getIndustryPack } from '@/lib/portal-universal/packs';
import { requireBrickSelections, type BrickSelection } from '@/lib/portal-universal/bricks/registry';
import { resolveEntitlementPackageKey } from './entitlement-package-key';
import { defaultModulesForPackage } from '@/lib/modules/registry';

export type ClientFactoryAssemblyInput = {
  packagePurchased: string;
  commerceOfferId?: string;
  businessOptionIds?: readonly string[];
  industryPackId?: string;
  bricks?: readonly BrickSelection[];
  tenantPreset?: string;
  isDemo?: boolean;
  requestedModuleIds?: readonly string[];
};

/**
 * Canonical Client Factory preflight for new automated provisioning.
 * Package entitlements are resolved first, explicit requests are merged, and
 * the Run 2 Assembly Engine remains the final fail-closed admission boundary.
 */
function requestedModules(input: ClientFactoryAssemblyInput) {
  const modules = defaultModulesForPackage(resolveEntitlementPackageKey(input), {
    tenantPreset: input.tenantPreset, isDemo: input.isDemo,
  });
  const options = (input.businessOptionIds ?? []).flatMap(id => {
    const option = getBusinessOption(id);
    if (!option) throw new Error(`Unknown business option: ${id}`);
    return [...option.moduleIds];
  });
  const pack = input.industryPackId ? getIndustryPack(input.industryPackId) : undefined;
  if (input.industryPackId && (!pack || pack.id === 'sample-placeholder')) throw new Error('Invalid production industry pack');
  const bricks = requireBrickSelections(input.bricks);
  return [...modules, ...(input.requestedModuleIds ?? []), ...options,
    ...(pack?.suggestedModuleIds ?? []), ...bricks.flatMap(x => [...x.entry.moduleIds])];
}
export function planClientFactoryAssembly(input: ClientFactoryAssemblyInput): AssemblyPlan {
  return createAssemblyPlan(requestedModules(input));
}
export function requireClientFactoryAssembly(input: ClientFactoryAssemblyInput): AssemblyPlan {
  return requireAssemblyPlan(requestedModules(input));
}
