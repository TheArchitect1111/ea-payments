/** Tenant preset reference for EA platform — deploy variants use TENANT_ID on portal repos. */

export type HubModuleId =
  | 'dashboard'
  | 'updates'
  | 'training'
  | 'video-learning'
  | 'documents'
  | 'messaging'
  | 'events'
  | 'opportunities-resources';

export type TenantPresetRef = {
  id: string;
  modules: string[];
  hubModuleIds: HubModuleId[];
};

export const FAMILY_HUB_TENANT: TenantPresetRef = {
  id: 'family-hub',
  modules: [
    'training',
    'video-learning',
    'documents',
    'assessments',
    'updates',
    'messaging',
    'events',
    'opportunities-resources',
  ],
  hubModuleIds: [
    'dashboard',
    'updates',
    'training',
    'video-learning',
    'documents',
    'messaging',
    'events',
    'opportunities-resources',
  ],
};

export const EA_CLIENT_TENANT: TenantPresetRef = {
  id: 'ea-client',
  modules: ['pulse', 'simplifi', 'magnifi', 'amplifi', 'updates', 'assessments'],
  hubModuleIds: ['dashboard', 'updates'],
};

export const TENANT_PRESETS: Record<string, TenantPresetRef> = {
  'family-hub': FAMILY_HUB_TENANT,
  'ea-client': EA_CLIENT_TENANT,
};
