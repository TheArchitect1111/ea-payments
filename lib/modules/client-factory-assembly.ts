import { createAssemblyPlan, requireAssemblyPlan, type AssemblyPlan } from '@/lib/modules/assembly';
import { defaultModulesForPackage } from '@/lib/modules/registry';

export type ClientFactoryAssemblyInput = {
  packagePurchased: string;
  tenantPreset?: string;
  isDemo?: boolean;
  requestedModuleIds?: readonly string[];
};

/**
 * Canonical Client Factory preflight for new automated provisioning.
 * Package entitlements are resolved first, explicit requests are merged, and
 * the Run 2 Assembly Engine remains the final fail-closed admission boundary.
 */
export function planClientFactoryAssembly(input: ClientFactoryAssemblyInput): AssemblyPlan {
  const packageModules = defaultModulesForPackage(input.packagePurchased, {
    tenantPreset: input.tenantPreset,
    isDemo: input.isDemo,
  });
  const requested = [...packageModules, ...(input.requestedModuleIds ?? [])];
  return createAssemblyPlan(requested);
}

/** Use this immediately before a new Client Factory provisioning write. */
export function requireClientFactoryAssembly(input: ClientFactoryAssemblyInput): AssemblyPlan {
  const packageModules = defaultModulesForPackage(input.packagePurchased, {
    tenantPreset: input.tenantPreset,
    isDemo: input.isDemo,
  });
  return requireAssemblyPlan([...packageModules, ...(input.requestedModuleIds ?? [])]);
}
