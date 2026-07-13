/**
 * Capability Framework bootstrap for ea-payments.
 *
 * Discovers manifests from live MODULE_REGISTRY + CAPABILITY_REGISTRY
 * via @ea/module-engine, overlaying the OS seed catalog.
 *
 * Non-goal: replace portal-modules entitlements yet — this is the bridge.
 */

import {
  CAPABILITY_CATALOG,
  moduleIdsToCapabilityIds,
  validateIdMapIntegrity,
  getCprHubReadiness,
  type CapabilityManifest,
} from '@ea/capability-registry';
import {
  CapabilityRegistry,
  adaptEaPortalRegistries,
  assembleFromCapabilityIds,
  assembleFromModuleIds,
  findMissingDependencies,
  type AssembledSurface,
} from '@ea/module-engine';
import { CAPABILITY_REGISTRY } from '@/lib/experience-registry';
import { MODULE_REGISTRY, type ModuleId } from '@/lib/modules/registry';

let cachedRegistry: CapabilityRegistry | undefined;
let cachedAdapted: CapabilityManifest[] | undefined;

function adaptLiveRegistries(): CapabilityManifest[] {
  if (cachedAdapted) return cachedAdapted;

  cachedAdapted = adaptEaPortalRegistries({
    modules: MODULE_REGISTRY.map((m) => ({
      id: m.id,
      name: m.name,
      title: m.title,
      description: m.description,
      navGroup: m.navGroup,
      showInNav: m.showInNav,
      navLabel: m.navLabel,
      pathSegment: m.pathSegment,
      requiredRole: m.requiredRole,
    })),
    capabilities: CAPABILITY_REGISTRY.map((c) => ({
      id: c.id,
      moduleId: c.moduleId,
      customerGoal: c.customerGoal,
      eaCapability: c.eaCapability,
      displayLabel: c.displayLabel,
      navGroup: c.navGroup,
      showInSidebar: c.showInSidebar,
      showInPillNav: c.showInPillNav,
      dashboardZone: c.dashboardZone,
      showOnDashboardHub: c.showOnDashboardHub,
      routePatterns: c.routePatterns,
      orbPolicy: c.orbPolicy,
    })),
    version: '0.1.0',
    consumers: ['ea-payments'],
  });

  return cachedAdapted;
}

/**
 * Platform capability registry: seed catalog + live ea-payments adapters.
 * Live rows override seed by id.
 */
export function getPlatformCapabilityRegistry(): CapabilityRegistry {
  if (cachedRegistry) return cachedRegistry;

  const registry = new CapabilityRegistry(CAPABILITY_CATALOG);
  registry.registerMany(adaptLiveRegistries());
  cachedRegistry = registry;
  return registry;
}

/** Test helper — clear singleton between runs. */
export function resetPlatformCapabilityRegistry(): void {
  cachedRegistry = undefined;
  cachedAdapted = undefined;
}

export function listPlatformCapabilities(): CapabilityManifest[] {
  return getPlatformCapabilityRegistry().list();
}

export function getPlatformMarketplaceEntries() {
  return getPlatformCapabilityRegistry().marketplaceEntries();
}

/** Assemble shell surface from entitled portal module ids. */
export function assembleSurfaceForModuleIds(
  moduleIds: Iterable<ModuleId> | ModuleId[],
): AssembledSurface {
  const ids = [...moduleIds];
  return assembleFromModuleIds(ids, {
    registry: getPlatformCapabilityRegistry(),
    organizationId: undefined,
  });
}

export function assembleSurfaceForCapabilityIds(
  capabilityIds: string[],
): AssembledSurface {
  return assembleFromCapabilityIds(capabilityIds, {
    registry: getPlatformCapabilityRegistry(),
  });
}

export function mapModuleIdsToCapabilityIds(moduleIds: ModuleId[]): string[] {
  return moduleIdsToCapabilityIds(moduleIds);
}

export function getDependencyGapsForModules(moduleIds: ModuleId[]) {
  const capabilityIds = moduleIdsToCapabilityIds(moduleIds);
  return findMissingDependencies(capabilityIds, getPlatformCapabilityRegistry());
}

/** Integrity snapshot for verify scripts / health. */
export function getCapabilityFrameworkHealth(): {
  ok: boolean;
  idMapErrors: string[];
  seedCount: number;
  adaptedCount: number;
  registryCount: number;
  moduleCount: number;
  experienceCapabilityCount: number;
  unmappedModules: string[];
  cprHubMapped: number;
  cprHubUnmapped: string[];
} {
  const idMapErrors = validateIdMapIntegrity();
  const cprReady = getCprHubReadiness();
  const adapted = adaptLiveRegistries();
  const registry = getPlatformCapabilityRegistry();

  const mappedModuleIds = new Set(
    adapted.map((m) => m.moduleId).filter(Boolean) as string[],
  );
  const unmappedModules = MODULE_REGISTRY.map((m) => m.id).filter(
    (id) => !mappedModuleIds.has(id),
  );

  return {
    ok:
      idMapErrors.length === 0 &&
      unmappedModules.length === 0 &&
      cprReady.unmapped.length === 0,
    idMapErrors,
    seedCount: CAPABILITY_CATALOG.length,
    adaptedCount: adapted.length,
    registryCount: registry.list().length,
    moduleCount: MODULE_REGISTRY.length,
    experienceCapabilityCount: CAPABILITY_REGISTRY.length,
    unmappedModules,
    cprHubMapped: cprReady.mapped.length,
    cprHubUnmapped: cprReady.unmapped,
  };
}
