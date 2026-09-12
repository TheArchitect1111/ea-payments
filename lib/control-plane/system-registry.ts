import registryJson from '@/config/ea-system-registry.json';

export type SystemEntityType = 'platform' | 'product' | 'client' | 'internal-system';
export type SystemLifecycle = 'active' | 'attention' | 'repository-only' | 'legacy' | 'retired';
export type SystemVerification = 'verified' | 'partial' | 'unverified';
export type SystemApprovalState = 'approved' | 'attention' | 'unapproved';

export type EASystemEntity = {
  id: string;
  name: string;
  entityType: SystemEntityType;
  lifecycle: SystemLifecycle;
  tenantId: string | null;
  canonicalRepo: string | null;
  canonicalBranch: string | null;
  canonicalPath: string | null;
  deploymentTarget: string | null;
  productionUrl: string | null;
  portalUrl: string | null;
  modules: string[];
  assetSource: string[];
  dataStores: string[];
  version: string;
  approvalState: SystemApprovalState;
  recoveryPoint: string;
  healthEndpoint: string | null;
  legacyProjects: string[];
  verification: SystemVerification;
};

type RegistryFile = {
  schemaVersion: number;
  authority: {
    desiredState: string;
    operationalProjection: string;
    compatibilityResolver: string;
    observedRuntime: string[];
    commandSurface: string;
  };
  entities: EASystemEntity[];
};

const registry = registryJson as RegistryFile;

export function getEASystemRegistry(): RegistryFile {
  return registry;
}

export function listEASystemEntities(): EASystemEntity[] {
  return registry.entities;
}

export function findEASystemEntity(id: string): EASystemEntity | undefined {
  return registry.entities.find((entity) => entity.id === id);
}

export function getEASystemRegistrySummary() {
  const entities = registry.entities;
  return {
    total: entities.length,
    active: entities.filter((entity) => entity.lifecycle === 'active').length,
    attention: entities.filter((entity) => entity.lifecycle === 'attention').length,
    repositoryOnly: entities.filter((entity) => entity.lifecycle === 'repository-only').length,
    verified: entities.filter((entity) => entity.verification === 'verified').length,
    partial: entities.filter((entity) => entity.verification === 'partial').length,
    withCanonicalRepo: entities.filter((entity) => Boolean(entity.canonicalRepo)).length,
    withProductionUrl: entities.filter((entity) => Boolean(entity.productionUrl)).length,
    withPortalUrl: entities.filter((entity) => Boolean(entity.portalUrl)).length,
  };
}
