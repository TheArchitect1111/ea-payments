import type { IndustryPack } from '@/lib/portal-universal/industry-pack';

/**
 * PLACEHOLDER ONLY — not a shipped industry portal.
 * Demonstrates schema shape for future packs (e.g. chapter/church).
 */
export const SAMPLE_PLACEHOLDER_PACK: IndustryPack = {
  id: 'sample-placeholder',
  version: '1.0.0',
  title: 'Sample Placeholder Industry Pack',
  description: 'Schema demo with placeholder labels. Not for production tenants.',
  presentation: 'workspace',
  suggestedModuleIds: ['dashboard', 'events', 'documents', 'messaging', 'resources', 'ask'],
  hideModuleIds: ['simplifi', 'amplifi'],
  useClientExperienceChrome: false,
  nav: [
    {
      id: 'home',
      universalCapabilityId: 'home',
      label: 'Chapter Home',
      order: 10,
      preferredModuleId: 'dashboard',
    },
    {
      id: 'calendar',
      universalCapabilityId: 'calendar',
      label: 'Calendar & Events',
      order: 20,
      preferredModuleId: 'events',
    },
    {
      id: 'messages',
      universalCapabilityId: 'messages',
      label: 'Messages',
      order: 30,
      preferredModuleId: 'messaging',
      minRole: 'guest',
    },
    {
      id: 'documents',
      universalCapabilityId: 'documents',
      label: 'Documents & Forms',
      order: 40,
      preferredModuleId: 'documents',
    },
    {
      id: 'resources',
      universalCapabilityId: 'resources',
      label: 'Training & Support',
      order: 50,
      preferredModuleId: 'resources',
    },
    {
      id: 'people',
      universalCapabilityId: 'people',
      label: 'Members',
      order: 60,
      visibility: { kind: 'never' },
    },
    {
      id: 'tasks',
      universalCapabilityId: 'tasks',
      label: 'Chapter Business',
      order: 70,
      visibility: { kind: 'never' },
    },
  ],
  branding: {
    workspaceName: 'Sample Chapter Portal',
    terminology: {
      members: 'Members',
      home: 'Chapter Home',
      startPrompt: 'What should the chapter advance this week?',
    },
  },
  extensions: {
    people: { enabled: false },
    tasks: { enabled: false },
    notifications: { enabled: false },
    formSchemaRefs: [
      {
        id: 'placeholder-application',
        universalCapabilityId: 'documents',
        title: 'Placeholder application form',
        schemaRef: 'schema:placeholder/application@1',
      },
    ],
    workflowRefs: [
      {
        id: 'placeholder-dues-reminder',
        purpose: 'Future dues reminder',
        providerHint: 'cron',
      },
    ],
    nba: {
      providerId: 'none',
      staticHeadline: 'Placeholder next action — not wired',
    },
  },
};
