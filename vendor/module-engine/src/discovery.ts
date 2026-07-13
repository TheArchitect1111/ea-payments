import type { CapabilityManifest } from '@ea/capability-registry';
import { CapabilityRegistry } from './registry.js';
import { discoverFromEaPortalRegistries } from './adapters/ea-portal.js';
import type { EaExperienceCapabilityInput, EaPortalModuleInput } from './types.js';

export type DiscoverySource =
  | { type: 'seed' }
  | {
      type: 'ea-portal';
      modules: EaPortalModuleInput[];
      capabilities: EaExperienceCapabilityInput[];
    }
  | { type: 'manifests'; manifests: CapabilityManifest[] };

/**
 * Build a registry from one or more discovery sources.
 * Seed catalog is always loaded first; later sources override by id.
 */
export function discoverCapabilities(sources: DiscoverySource[]): CapabilityRegistry {
  const registry = new CapabilityRegistry();

  for (const source of sources) {
    if (source.type === 'seed') {
      // already seeded in constructor
      continue;
    }
    if (source.type === 'manifests') {
      registry.registerMany(source.manifests);
      continue;
    }
    if (source.type === 'ea-portal') {
      registry.registerMany(
        discoverFromEaPortalRegistries(source.modules, source.capabilities),
      );
    }
  }

  return registry;
}
