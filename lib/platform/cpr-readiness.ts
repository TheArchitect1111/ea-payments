/**
 * CPR readiness bridge ? hubModuleId map coverage + discovery adapter.
 * Does NOT migrate CPR runtime.
 */
import {
  CPR_HUB_MODULE_IDS,
  CPR_TENANT_HUB_MODULE_IDS,
  FAMILY_HUB_MODULE_IDS,
  getCprHubReadiness,
  resolveCprHubCapabilityIds,
} from '@ea/capability-registry';
import {
  adaptCprHubModules,
  discoverFromCprHubModules,
  type CprHubModuleInput,
} from '@ea/module-engine';

/** Minimal CPR hub catalog for discovery (titles only ? runtime stays in CPR repo). */
export const CPR_HUB_CATALOG: Record<string, Omit<CprHubModuleInput, 'hubModuleId'>> = {
  dashboard: { title: 'Dashboard', path: '', tag: 'Core' },
  amplifi: { title: 'Amplifi', path: 'amplifi', tag: 'Amplifi' },
  updates: { title: 'Updates', path: 'updates', tag: 'Updates' },
  'recruiting-timeline': { title: 'Timeline', path: 'recruiting-timeline', tag: 'Recruiting' },
  'eligibility-center': { title: 'Requirements', path: 'eligibility-center', tag: 'Recruiting' },
  'scholarship-center': { title: 'Opportunities', path: 'scholarship-center', tag: 'Recruiting' },
  training: { title: 'Training', path: 'video-learning-center', tag: 'Training' },
  'video-learning': { title: 'Video learning', path: 'video-learning-center', tag: 'Training' },
  'resource-library': { title: 'Resource library', path: 'resource-library', tag: 'Resources' },
  'ask-guide': { title: 'Ask CPR', path: 'ask-cpr', tag: 'Guide' },
  messaging: { title: 'Messaging', path: 'messaging-center', tag: 'Communication' },
  documents: { title: 'Documents', path: 'document-vault', tag: 'Documents' },
  events: { title: 'Events', path: 'upcoming-events', tag: 'Events' },
  'family-calendar': { title: 'Shared calendar', path: 'upcoming-events', tag: 'Calendar' },
  'opportunities-resources': {
    title: 'Curated opportunities',
    path: 'opportunities-resources',
    tag: 'Opportunities',
  },
};

export function getPlatformCprReadiness() {
  const readiness = getCprHubReadiness(CPR_HUB_MODULE_IDS);
  const cprTenant = discoverFromCprHubModules(CPR_TENANT_HUB_MODULE_IDS, CPR_HUB_CATALOG);
  const familyHub = discoverFromCprHubModules(FAMILY_HUB_MODULE_IDS, CPR_HUB_CATALOG);

  return {
    ...readiness,
    cprTenant: {
      hubModuleCount: CPR_TENANT_HUB_MODULE_IDS.length,
      manifestCount: cprTenant.manifests.length,
      unmappedHubModuleIds: cprTenant.unmappedHubModuleIds,
      capabilityIds: resolveCprHubCapabilityIds(CPR_TENANT_HUB_MODULE_IDS),
    },
    familyHub: {
      hubModuleCount: FAMILY_HUB_MODULE_IDS.length,
      manifestCount: familyHub.manifests.length,
      unmappedHubModuleIds: familyHub.unmappedHubModuleIds,
      capabilityIds: resolveCprHubCapabilityIds(FAMILY_HUB_MODULE_IDS),
    },
    migrationStatus: 'not-started' as const,
    note: 'Readiness only ? CPR portal runtime is not migrated.',
  };
}

export {
  CPR_HUB_MODULE_IDS,
  CPR_TENANT_HUB_MODULE_IDS,
  FAMILY_HUB_MODULE_IDS,
  adaptCprHubModules,
  discoverFromCprHubModules,
};
