import type { IndustryPack } from '@/lib/portal-universal/industry-pack';

/**
 * Real Estate Client Experience — CX chrome with realtor terminology.
 * No MLS/CRM integration; labels and nav only.
 */
export const REAL_ESTATE_PACK: IndustryPack = {
  id: 'real-estate',
  version: '1.0.0',
  title: 'Real Estate Client Experience',
  description:
    'Website + Portal realtor chrome (Pipeline, Listings, Documents, Contact, Help).',
  presentation: 'client',
  useClientExperienceChrome: true,
  suggestedModuleIds: ['ctp', 'documents', 'messaging', 'ask', 'resources', 'dashboard', 'events'],
  hideModuleIds: ['pulse', 'simplifi', 'amplifi', 'connect'],
  nav: [
    {
      id: 'pipeline',
      universalCapabilityId: 'home',
      label: 'Your Pipeline',
      order: 10,
      preferredModuleId: 'ctp',
      hrefOverride: '/portal/{slug}/ctp/progress',
    },
    {
      id: 'listings',
      universalCapabilityId: 'programs',
      label: 'Your Listings',
      order: 20,
      preferredModuleId: 'ctp',
      hrefOverride: '/portal/{slug}/ctp',
    },
    {
      id: 'intake',
      universalCapabilityId: 'programs',
      label: 'Intake',
      order: 25,
      preferredModuleId: 'intake',
      hrefOverride: '/portal/{slug}/intake',
    },
    {
      id: 'documents',
      universalCapabilityId: 'documents',
      label: 'Documents',
      order: 30,
      preferredModuleId: 'ctp',
      hrefOverride: '/portal/{slug}/ctp/documents',
    },
    {
      id: 'messages',
      universalCapabilityId: 'messages',
      label: 'Contact',
      order: 40,
      preferredModuleId: 'ctp',
      hrefOverride: '/portal/{slug}/ctp/messages',
    },
    {
      id: 'support',
      universalCapabilityId: 'resources',
      label: 'Help',
      order: 50,
      preferredModuleId: 'ctp',
      hrefOverride: '/portal/{slug}/ctp/support',
    },
    {
      id: 'people',
      universalCapabilityId: 'people',
      label: 'People',
      order: 900,
      visibility: { kind: 'never' },
    },
    {
      id: 'tasks',
      universalCapabilityId: 'tasks',
      label: 'Tasks',
      order: 910,
      visibility: { kind: 'never' },
    },
  ],
  branding: {
    terminology: {
      home: 'Your Pipeline',
      members: 'Buyer',
      startPrompt: 'What property are we working on next?',
      focus: 'Active listings',
      attention: 'Needs your review',
      start: 'View pipeline',
    },
  },
  extensions: {
    people: { enabled: false },
    tasks: { enabled: false },
    notifications: { enabled: false },
    nba: {
      providerId: 'real-estate-guide',
      staticHeadline: 'Your next step in the buying or selling journey',
    },
  },
};
