import type { CapabilityManifest } from './types';

/**
 * Canonical EA CRM capability.
 *
 * The authoritative implementation lives in the EA chassis. Client products
 * consume/configure this capability; they do not own or fork the CRM engine/UI.
 */
export const CRM_CAPABILITY_MANIFEST: CapabilityManifest = {
  id: 'crm',
  version: '0.1.0',
  status: 'Development',
  category: 'CRM',
  name: 'EA CRM',
  description: 'Tenant-safe relationship, pipeline, task, activity, and follow-up management with Eva intelligence.',
  purpose: 'Give every EA portal an independently enableable CRM without requiring client-specific CRM implementations.',
  moduleId: 'crm',
  enableKey: 'crm',
  dependencies: ['authentication', 'organizations', 'users'],
  certified: false,
  consumers: [],
  potentialConsumers: ['ea-payments', 'cpr', 'etfm', '3hc', 'bob-rumball'],
  owner: 'EA Platform',
  documentation: 'docs/EA-CRM-FRAPPE-BLUEPRINT.md',
  configuration: {
    type: 'object',
    description: 'Provider and tenant-specific CRM configuration. Memory is permitted for development; Frappe is the production target.',
    properties: {
      provider: { enum: ['memory', 'frappe'] },
      tenantId: { type: 'string' },
    },
  },
  permissions: [
    { id: 'crm.view', description: 'View CRM records and pipeline', roles: ['owner', 'admin', 'staff'] },
    { id: 'crm.manage', description: 'Create and update CRM records', roles: ['owner', 'admin', 'staff'] },
    { id: 'crm.configure', description: 'Configure CRM provider and tenant settings', roles: ['owner', 'admin'] },
  ],
  routes: [{ path: '/portal/[slug]/crm', description: 'Tenant CRM workspace' }],
  widgets: [
    { id: 'crm-pipeline', title: 'Opportunity Pipeline', zone: 'main' },
    { id: 'crm-tasks', title: 'Follow-up Tasks', zone: 'main' },
    { id: 'crm-eva-actions', title: 'Eva Next Best Actions', zone: 'north-star' },
  ],
  dashboardCards: [
    { id: 'crm-open-pipeline', title: 'Open Pipeline', zone: 'dashboard' },
    { id: 'crm-overdue-followups', title: 'Overdue Follow-ups', zone: 'dashboard' },
  ],
  navigation: [{ label: 'CRM', path: '/crm', group: 'operations' }],
  aiSkills: [
    {
      id: 'crm-next-action',
      description: 'Identify the highest-value CRM action that should happen next.',
      examples: ['Who needs a follow-up?', 'What deal needs attention?', 'What should I do next?'],
    },
    {
      id: 'crm-stalled-opportunities',
      description: 'Find stalled opportunities and explain why they need attention.',
      examples: ['Which opportunities are stalled?', 'What has gone quiet?'],
    },
  ],
  healthChecks: [
    { id: 'crm-provider', description: 'Verify the configured CRM provider is reachable and tenant-scoped.', probe: 'crm-provider' },
  ],
  featureFlags: ['crm'],
  databaseTables: ['EA Contact', 'EA Organization', 'EA Opportunity', 'EA Task', 'EA Activity', 'EA Note'],
  requiredServices: [],
  currentRepositories: ['ea-operating-system'],
  currentFiles: ['packages/crm-engine', 'packages/crm-portal-module', 'frappe_apps/ea_crm'],
  reusable: true,
  reuseEvidence: 'Shared provider-independent engine, shared portal module, and EA-owned Frappe data model exist in the chassis.',
  extractionEffort: 'S',
  riskLevel: 'low',
  recommendedPriority: 'P1',
};
