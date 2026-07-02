/** Tenant preset reference — module ids align with `lib/modules/registry.ts`. */

import {
  TENANT_MODULE_PRESETS,
  type ModuleId,
} from '@/lib/modules/registry';

export type HubModuleId = ModuleId;

export type TenantPresetRef = {
  id: string;
  modules: ModuleId[];
  hubModuleIds: ModuleId[];
};

export const FAMILY_HUB_TENANT: TenantPresetRef = {
  id: 'family-hub',
  modules: TENANT_MODULE_PRESETS['family-hub'],
  hubModuleIds: TENANT_MODULE_PRESETS['family-hub'],
};

export const EA_CLIENT_TENANT: TenantPresetRef = {
  id: 'ea-client',
  modules: TENANT_MODULE_PRESETS['ea-client'],
  hubModuleIds: TENANT_MODULE_PRESETS['ea-client'],
};

export const TENANT_PRESETS: Record<string, TenantPresetRef> = {
  'family-hub': FAMILY_HUB_TENANT,
  'ea-client': EA_CLIENT_TENANT,
};
