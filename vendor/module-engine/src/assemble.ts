import {
  enableKeysToCapabilityIds,
  moduleIdsToCapabilityIds,
  type ClientCapabilityConfig,
} from '@ea/capability-registry';
import { getDefaultRegistry, type CapabilityRegistry } from './registry';
import type { AssembledSurface } from './types';

export type AssembleOptions = {
  registry?: CapabilityRegistry;
  organizationId?: string;
  /** Prefer skipping unknown ids silently (default) or collect as missing. */
  strict?: boolean;
};

/**
 * Assemble workspace/portal surface from enabled capability ids.
 * The shell must not hard-code client navigation — it renders this result.
 */
export function assembleFromCapabilityIds(
  enabledCapabilityIds: string[],
  options: AssembleOptions = {},
): AssembledSurface {
  const registry = options.registry ?? getDefaultRegistry();
  const navigation: AssembledSurface['navigation'] = [];
  const routes: AssembledSurface['routes'] = [];
  const widgets: AssembledSurface['widgets'] = [];
  const dashboardCards: AssembledSurface['dashboardCards'] = [];
  const permissions: AssembledSurface['permissions'] = [];
  const aiSkills: AssembledSurface['aiSkills'] = [];
  const featureFlags = new Set<string>();
  const manifests: AssembledSurface['manifests'] = [];
  const missingCapabilityIds: string[] = [];

  for (const id of enabledCapabilityIds) {
    const manifest = registry.get(id);
    if (!manifest) {
      missingCapabilityIds.push(id);
      if (options.strict) {
        throw new Error(`Unknown capability id: ${id}`);
      }
      continue;
    }

    manifests.push(manifest);

    for (const nav of manifest.navigation ?? []) {
      navigation.push({
        capabilityId: id,
        label: nav.label,
        path: nav.path,
        group: nav.group,
      });
    }

    for (const route of manifest.routes) {
      routes.push({
        capabilityId: id,
        path: route.path,
        description: route.description,
      });
    }

    for (const widget of manifest.widgets) {
      widgets.push({
        capabilityId: id,
        id: widget.id,
        title: widget.title,
        zone: widget.zone,
      });
    }

    for (const card of manifest.dashboardCards ?? []) {
      dashboardCards.push({
        capabilityId: id,
        id: card.id,
        title: card.title,
        zone: card.zone,
      });
    }

    for (const permission of manifest.permissions) {
      permissions.push({ capabilityId: id, ...permission });
    }

    for (const skill of manifest.aiSkills) {
      aiSkills.push({ capabilityId: id, ...skill });
    }

    for (const flag of manifest.featureFlags ?? []) {
      featureFlags.add(flag);
    }
  }

  return {
    organizationId: options.organizationId,
    enabledCapabilityIds: [...enabledCapabilityIds],
    missingCapabilityIds,
    navigation,
    routes,
    widgets,
    dashboardCards,
    permissions,
    aiSkills,
    featureFlags: [...featureFlags],
    manifests,
  };
}

/** Assemble from workspace clientConfigs-style enable keys. */
export function assembleFromEnableKeys(
  enableKeys: string[],
  options: AssembleOptions = {},
): AssembledSurface {
  return assembleFromCapabilityIds(enableKeysToCapabilityIds(enableKeys), options);
}

/** Assemble from ea-payments MODULE_IDS. */
export function assembleFromModuleIds(
  moduleIds: string[],
  options: AssembleOptions = {},
): AssembledSurface {
  return assembleFromCapabilityIds(moduleIdsToCapabilityIds(moduleIds), options);
}

/** Assemble from ClientCapabilityConfig envelope. */
export function assembleFromClientConfig(
  config: ClientCapabilityConfig,
  options: AssembleOptions = {},
): AssembledSurface {
  return assembleFromCapabilityIds(config.enabledCapabilities, {
    ...options,
    organizationId: options.organizationId ?? config.organizationId,
  });
}

/**
 * Dependency check — returns missing dependency ids for the enabled set.
 * Does not auto-enable dependencies (caller decides).
 */
export function findMissingDependencies(
  enabledCapabilityIds: string[],
  registry: CapabilityRegistry = getDefaultRegistry(),
): Array<{ capabilityId: string; missingDependency: string }> {
  const enabled = new Set(enabledCapabilityIds);
  const gaps: Array<{ capabilityId: string; missingDependency: string }> = [];

  for (const id of enabledCapabilityIds) {
    const manifest = registry.get(id);
    if (!manifest) continue;
    for (const dep of manifest.dependencies) {
      // Dependencies may be foundation ids not yet in catalog (e.g. authentication).
      // Only flag when the dependency exists in the registry and is not enabled.
      if (registry.has(dep) && !enabled.has(dep)) {
        gaps.push({ capabilityId: id, missingDependency: dep });
      }
    }
  }

  return gaps;
}
