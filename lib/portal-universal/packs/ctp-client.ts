import type { IndustryPack } from '@/lib/portal-universal/industry-pack';

/**
 * CTP Client Experience pack — same five destinations as buildClientExperienceNav defaults.
 * presentation: client; never includes Executive modules (Pulse/Simplifi/Amplifi).
 */
export const CTP_CLIENT_PACK: IndustryPack = {
  id: 'ctp-client',
  version: '1.0.0',
  title: 'CTP Client Experience',
  description: 'Website + Portal / CTP client chrome (Progress, Documents, Contact, Help, Journey).',
  presentation: 'client',
  useClientExperienceChrome: true,
  suggestedModuleIds: ['ctp', 'documents', 'messaging', 'ask', 'resources', 'dashboard'],
  // Structural CX destinations — do not surface executive product modules in chrome.
  hideModuleIds: ['pulse', 'simplifi', 'amplifi', 'connect'],
  nav: [
    {
      id: 'progress',
      universalCapabilityId: 'home',
      label: 'Your Project',
      order: 10,
      preferredModuleId: 'ctp',
      hrefOverride: '/portal/{slug}/ctp/progress',
    },
    {
      id: 'documents',
      universalCapabilityId: 'documents',
      label: 'Documents',
      order: 20,
      preferredModuleId: 'ctp',
      hrefOverride: '/portal/{slug}/ctp/documents',
    },
    {
      id: 'messages',
      universalCapabilityId: 'messages',
      label: 'Contact',
      order: 30,
      preferredModuleId: 'ctp',
      hrefOverride: '/portal/{slug}/ctp/messages',
    },
    {
      id: 'support',
      universalCapabilityId: 'resources',
      label: 'Help',
      order: 40,
      preferredModuleId: 'ctp',
      hrefOverride: '/portal/{slug}/ctp/support',
    },
    {
      id: 'journey',
      universalCapabilityId: 'programs',
      label: 'Journey',
      order: 50,
      preferredModuleId: 'ctp',
      hrefOverride: '/portal/{slug}/ctp',
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
      home: 'Your Project',
      members: 'Client',
    },
  },
  extensions: {
    people: { enabled: false },
    tasks: { enabled: false },
    notifications: { enabled: false },
    nba: {
      providerId: 'ctp-guide',
      staticHeadline: 'Guided by your Next Best Action',
    },
  },
};
