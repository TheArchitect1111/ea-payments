export type {
  CapabilityContribution,
  AssembledSurface,
  EaPortalModuleInput,
  EaExperienceCapabilityInput,
} from './types.js';

export {
  CapabilityRegistry,
  getDefaultRegistry,
  resetDefaultRegistry,
} from './registry.js';

export {
  assembleFromCapabilityIds,
  assembleFromEnableKeys,
  assembleFromModuleIds,
  assembleFromClientConfig,
  findMissingDependencies,
} from './assemble.js';

export type { AssembleOptions } from './assemble.js';

export { discoverCapabilities } from './discovery.js';
export type { DiscoverySource } from './discovery.js';

export {
  adaptEaPortalRegistries,
  discoverFromEaPortalRegistries,
} from './adapters/ea-portal.js';

export {
  adaptCprHubModules,
  discoverFromCprHubModules,
} from './adapters/cpr-hub.js';
export type { CprHubModuleInput } from './adapters/cpr-hub.js';
