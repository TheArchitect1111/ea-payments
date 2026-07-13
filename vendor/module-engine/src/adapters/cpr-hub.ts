/**
 * Adapter: CPR hub modules ? CapabilityManifest[] (readiness / discovery only).
 * Does not replace CPR portal runtime ? use for platform inventory + future cutover.
 */

import type { CapabilityManifest, CapabilityCategory } from '@ea/capability-registry';
import { getMapRowByHubModuleId } from '@ea/capability-registry';

export type CprHubModuleInput = {
  hubModuleId: string;
  title: string;
  description?: string;
  path?: string;
  tag?: string;
};

const CATEGORY_FALLBACK: CapabilityCategory = 'Other';

/**
 * Adapt CPR-shaped hub modules into Capability Framework manifests via hubModuleId map.
 */
export function adaptCprHubModules(input: {
  modules: CprHubModuleInput[];
  version?: string;
  consumers?: string[];
}): {
  manifests: CapabilityManifest[];
  unmappedHubModuleIds: string[];
} {
  const version = input.version ?? '0.1.0';
  const consumers = input.consumers ?? ['cpr'];
  const manifests: CapabilityManifest[] = [];
  const unmappedHubModuleIds: string[] = [];

  for (const mod of input.modules) {
    const row = getMapRowByHubModuleId(mod.hubModuleId);
    if (!row) {
      unmappedHubModuleIds.push(mod.hubModuleId);
      continue;
    }

    const capabilityId = row.capabilityId;
    const path = (mod.path ?? mod.hubModuleId).replace(/^\//, '');

    manifests.push({
      id: capabilityId,
      version,
      status: 'Development',
      category: (row.category as CapabilityCategory) || CATEGORY_FALLBACK,
      name: mod.title,
      description: mod.description || mod.title,
      purpose: mod.description || mod.title,
      moduleId: row.moduleId,
      enableKey: row.enableKey,
      hubModuleId: mod.hubModuleId,
      consumers,
      dependencies: ['authentication'],
      certified: false,
      owner: 'EA Platform',
      permissions: [
        {
          id: `hub:${mod.hubModuleId}`,
          roles: ['member'],
          description: `Access CPR hub module ${mod.title}`,
        },
      ],
      routes: [{ path, description: mod.title }],
      navigation: [
        {
          label: mod.title,
          path,
          group: mod.tag,
        },
      ],
      widgets: [],
      aiSkills: [],
      reusable: true,
      currentRepositories: ['cpr-governance-baseline'],
      recommendedPriority: 'P2',
      riskLevel: 'medium',
      extractionEffort: 'M',
    });
  }

  return { manifests, unmappedHubModuleIds };
}

/** Discover manifests for a CPR tenant hubModuleIds list. */
export function discoverFromCprHubModules(
  hubModuleIds: readonly string[],
  catalog: Record<string, Omit<CprHubModuleInput, 'hubModuleId'>>,
): ReturnType<typeof adaptCprHubModules> {
  const modules: CprHubModuleInput[] = hubModuleIds.map((hubModuleId) => {
    const entry = catalog[hubModuleId];
    return {
      hubModuleId,
      title: entry?.title ?? hubModuleId,
      description: entry?.description,
      path: entry?.path,
      tag: entry?.tag,
    };
  });
  return adaptCprHubModules({ modules });
}
