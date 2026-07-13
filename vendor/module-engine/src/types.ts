import type { CapabilityManifest } from '@ea/capability-registry';

/** Contribution a capability makes to the Workspace / Portal shell. */
export type CapabilityContribution = {
  capabilityId: string;
  navigation: NonNullable<CapabilityManifest['navigation']>;
  routes: CapabilityManifest['routes'];
  widgets: CapabilityManifest['widgets'];
  dashboardCards: NonNullable<CapabilityManifest['dashboardCards']>;
  permissions: CapabilityManifest['permissions'];
  aiSkills: CapabilityManifest['aiSkills'];
  featureFlags: string[];
};

/** Assembled application surface from enabled capabilities only. */
export type AssembledSurface = {
  organizationId?: string;
  enabledCapabilityIds: string[];
  missingCapabilityIds: string[];
  navigation: Array<{ capabilityId: string; label: string; path: string; group?: string }>;
  routes: Array<{ capabilityId: string; path: string; description?: string }>;
  widgets: Array<{ capabilityId: string; id: string; title: string; zone?: string }>;
  dashboardCards: Array<{ capabilityId: string; id: string; title: string; zone?: string }>;
  permissions: Array<{ capabilityId: string; id: string; description?: string; roles?: string[] }>;
  aiSkills: Array<{
    capabilityId: string;
    id: string;
    description: string;
    examples?: string[];
  }>;
  featureFlags: string[];
  manifests: CapabilityManifest[];
};

/** Raw technical module shape from ea-payments MODULE_REGISTRY (subset). */
export type EaPortalModuleInput = {
  id: string;
  name: string;
  title: string;
  description: string;
  navGroup: string;
  showInNav: boolean;
  navLabel?: string;
  pathSegment: string;
  requiredRole: string;
};

/** Raw capability map row from ea-payments experience-registry (subset). */
export type EaExperienceCapabilityInput = {
  id: string;
  moduleId: string;
  customerGoal: string;
  eaCapability: string;
  displayLabel: string;
  navGroup: string;
  showInSidebar: boolean;
  showInPillNav: boolean;
  dashboardZone: string;
  showOnDashboardHub: boolean;
  routePatterns: string[];
  orbPolicy: string;
};
