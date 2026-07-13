/**
 * EA Capability Framework — metadata contract.
 *
 * Capabilities are independently enableable business modules.
 * Engines (workspace / portal / website) discover and host them.
 * Do not invent capabilities without reuse evidence.
 */

/** Lifecycle status for marketplace / certification. */
export const CAPABILITY_STATUSES = [
  'Planning',
  'Development',
  'Testing',
  'Certified',
  'Deprecated',
] as const;

export type CapabilityStatus = (typeof CAPABILITY_STATUSES)[number];

/** Marketplace taxonomy (Capability Framework v1.0 categories). */
export const CAPABILITY_CATEGORIES = [
  'Authentication',
  'Organizations',
  'Users',
  'Roles',
  'Permissions',
  'Registration',
  'Profiles',
  'Portal',
  'Workspace',
  'Dashboard',
  'Messaging',
  'Documents',
  'Storage',
  'Payments',
  'Invoices',
  'Subscriptions',
  'Assessments',
  'Forms',
  'Workflow',
  'Approvals',
  'Tasks',
  'Calendar',
  'Scheduling',
  'Notifications',
  'Email',
  'SMS',
  'AI Advisor',
  'Search',
  'Reporting',
  'Analytics',
  'Automation',
  'Knowledge Base',
  'Training',
  'Learning',
  'Video',
  'Certificates',
  'Events',
  'CRM',
  'Contacts',
  'Opportunities',
  'Proposals',
  'Contracts',
  'Surveys',
  'Recruiting',
  'Compliance',
  'Eligibility',
  'Media Library',
  'Branding',
  'Settings',
  'Audit Trail',
  'API Integrations',
  'Other',
] as const;

export type CapabilityCategory = (typeof CAPABILITY_CATEGORIES)[number];

export type ExtractionEffort = 'S' | 'M' | 'L' | 'XL';
export type RiskLevel = 'low' | 'medium' | 'high';
export type Priority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'later';

/** JSON Schema-ish config envelope (kept loose for v0.1). */
export type ConfigurationSchema = {
  type?: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
  description?: string;
};

export type CapabilityRoute = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'ANY';
  description?: string;
};

export type CapabilityPermission = {
  id: string;
  description?: string;
  roles?: string[];
};

export type CapabilityWidget = {
  id: string;
  title: string;
  zone?: string;
  description?: string;
};

export type CapabilityAiSkill = {
  id: string;
  description: string;
  /** Example questions the capability can answer. */
  examples?: string[];
};

export type CapabilityHealthCheck = {
  id: string;
  description: string;
  /** Relative path or named probe. */
  probe?: string;
};

/**
 * Full capability metadata — what the Workspace Engine and marketplace need.
 */
export type CapabilityManifest = {
  id: string;
  version: string;
  status: CapabilityStatus;
  category: CapabilityCategory;
  name: string;
  description: string;
  purpose: string;

  /** Technical module id in ea-payments MODULE_REGISTRY (when mapped). */
  moduleId?: string;
  /** Workspace client enable key in clientConfigs (when mapped). */
  enableKey?: string;
  /** CPR hub module id (when mapped). */
  hubModuleId?: string;

  dependencies: string[];
  certified: boolean;
  consumers: string[];
  potentialConsumers?: string[];
  owner?: string;
  documentation?: string;

  configuration?: ConfigurationSchema;
  permissions: CapabilityPermission[];
  routes: CapabilityRoute[];
  apis?: CapabilityRoute[];
  widgets: CapabilityWidget[];
  dashboardCards?: CapabilityWidget[];
  navigation?: Array<{ label: string; path: string; group?: string }>;
  aiSkills: CapabilityAiSkill[];
  healthChecks?: CapabilityHealthCheck[];
  featureFlags?: string[];

  databaseTables?: string[];
  requiredServices?: string[];
  currentRepositories?: string[];
  currentFiles?: string[];

  reusable: boolean;
  reuseEvidence?: string;
  extractionEffort?: ExtractionEffort;
  riskLevel?: RiskLevel;
  recommendedPriority?: Priority;
};

/** Client application assembled by enabling capabilities. */
export type ClientCapabilityConfig = {
  organizationId: string;
  name: string;
  workspaceName?: string;
  themeId?: string;
  personalityId?: string;
  enabledCapabilities: string[];
  plannedCapabilities?: string[];
  terminology?: Record<string, string>;
  aiProfile?: string;
};
