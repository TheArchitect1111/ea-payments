/**
 * Adapter: ea-payments MODULE_REGISTRY + CAPABILITY_REGISTRY → CapabilityManifest[].
 * Keeps runtime apps as source of live module data while platform catalog stays canonical.
 */

import type { CapabilityManifest, CapabilityCategory } from '@ea/capability-registry';
import {
  getMapRowByModuleId,
  resolveCanonicalCapabilityId,
} from '@ea/capability-registry';
import type { EaExperienceCapabilityInput, EaPortalModuleInput } from '../types';

const CATEGORY_FALLBACK: CapabilityCategory = 'Other';

function categoryForModule(moduleId: string): CapabilityCategory {
  const row = getMapRowByModuleId(moduleId);
  if (row?.category) {
    return row.category as CapabilityCategory;
  }
  return CATEGORY_FALLBACK;
}

/**
 * Merge technical portal modules with experience-registry rows into manifests.
 */
export function adaptEaPortalRegistries(input: {
  modules: EaPortalModuleInput[];
  capabilities: EaExperienceCapabilityInput[];
  version?: string;
  consumers?: string[];
}): CapabilityManifest[] {
  const byModule = new Map(input.capabilities.map((c) => [c.moduleId, c]));
  const version = input.version ?? '0.1.0';
  const consumers = input.consumers ?? ['ea-payments'];

  return input.modules.map((mod) => {
    const exp = byModule.get(mod.id);
    const capabilityId =
      resolveCanonicalCapabilityId({
        moduleId: mod.id,
        experienceCapabilityId: exp?.id,
      }) ?? exp?.id ?? mod.id;

    const pathSegment = mod.pathSegment;
    const portalPath = pathSegment
      ? `/portal/[slug]/${pathSegment}`
      : '/portal/[slug]';

    const navigation =
      mod.showInNav || exp?.showInSidebar
        ? [
            {
              label: exp?.displayLabel ?? mod.navLabel ?? mod.name,
              path: pathSegment,
              group: exp?.navGroup ?? mod.navGroup,
            },
          ]
        : [];

    const widgets =
      exp?.showOnDashboardHub
        ? [
            {
              id: `${capabilityId}-hub`,
              title: exp.displayLabel,
              zone: exp.dashboardZone === 'none' ? undefined : exp.dashboardZone,
            },
          ]
        : [];

    const aiSkills =
      exp?.orbPolicy && exp.orbPolicy !== 'ignore'
        ? [
            {
              id: `${capabilityId}-orb`,
              description: exp.customerGoal,
              examples: [exp.customerGoal],
            },
          ]
        : [];

    return {
      id: capabilityId,
      version,
      status: 'Development' as const,
      category: categoryForModule(mod.id),
      name: exp?.eaCapability ?? mod.name,
      description: mod.description,
      purpose: exp?.customerGoal ?? mod.title,
      moduleId: mod.id,
      enableKey: getMapRowByModuleId(mod.id)?.enableKey,
      hubModuleId: getMapRowByModuleId(mod.id)?.hubModuleId,
      dependencies: ['authentication'],
      certified: false,
      consumers,
      owner: 'EA Platform',
      permissions: [
        {
          id: `module:${mod.id}`,
          roles: [mod.requiredRole],
          description: `Access ${mod.name}`,
        },
      ],
      routes: [
        { path: portalPath, description: mod.title },
        ...(exp?.routePatterns.map((p) => ({ path: p })) ?? []),
      ],
      widgets,
      navigation,
      aiSkills,
      reusable: true,
      currentRepositories: ['ea-launch-audit/ea-payments'],
      currentFiles: [
        'lib/modules/registry.ts',
        'lib/experience-registry.ts',
      ],
      recommendedPriority: 'P1' as const,
      riskLevel: 'medium' as const,
      extractionEffort: 'M' as const,
    };
  });
}

/**
 * Discover manifests from live EA portal registries and register them.
 * Call from ea-payments bootstrap once registries are imported.
 */
export function discoverFromEaPortalRegistries(
  modules: EaPortalModuleInput[],
  capabilities: EaExperienceCapabilityInput[],
): CapabilityManifest[] {
  return adaptEaPortalRegistries({ modules, capabilities });
}
