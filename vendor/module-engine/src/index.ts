export type {
  CapabilityContribution,
  AssembledSurface,
  EaPortalModuleInput,
  EaExperienceCapabilityInput,
} from './types';

export {
  CapabilityRegistry,
  getDefaultRegistry,
  resetDefaultRegistry,
} from './registry';

export {
  assembleFromCapabilityIds,
  assembleFromEnableKeys,
  assembleFromModuleIds,
  assembleFromClientConfig,
  findMissingDependencies,
} from './assemble';

export type { AssembleOptions } from './assemble';

export { discoverCapabilities } from './discovery';
export type { DiscoverySource } from './discovery';

export {
  adaptEaPortalRegistries,
  discoverFromEaPortalRegistries,
} from './adapters/ea-portal';

export {
  adaptCprHubModules,
  discoverFromCprHubModules,
} from './adapters/cpr-hub';
export type { CprHubModuleInput } from './adapters/cpr-hub';
