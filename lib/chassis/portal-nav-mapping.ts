import type { EAPortalTab } from '@/lib/chassis/PortalShell';
import type { ModuleId } from '@/lib/modules/registry';

export type PortalNavIconName =
  | 'grid'
  | 'pulse'
  | 'simplifi'
  | 'amplifi'
  | 'connect'
  | 'updates'
  | 'documents'
  | 'events'
  | 'resources'
  | 'messaging'
  | 'learning'
  | 'ask';

const MODULE_NAV_ICONS: Partial<Record<ModuleId, PortalNavIconName>> = {
  dashboard: 'grid',
  pulse: 'pulse',
  simplifi: 'simplifi',
  amplifi: 'amplifi',
  connect: 'connect',
  'update-hub': 'updates',
  documents: 'documents',
  events: 'events',
  resources: 'resources',
  messaging: 'messaging',
  training: 'learning',
  ask: 'ask',
  ctp: 'grid',
  billing: 'documents',
};

const MODULE_ACTIVE_TABS: Partial<Record<ModuleId, EAPortalTab>> = {
  dashboard: 'home',
  pulse: 'pulse',
  simplifi: 'simplifi',
  amplifi: 'amplifi',
  connect: 'connect',
  'update-hub': 'updates',
  documents: 'documents',
  events: 'events',
  resources: 'resources',
  messaging: 'messaging',
  training: 'learning',
  ask: 'ask',
  ctp: 'ctp',
};

export function portalNavIconForModule(moduleId: ModuleId): PortalNavIconName {
  return MODULE_NAV_ICONS[moduleId] ?? 'grid';
}

export function portalActiveTabForModule(moduleId: ModuleId): EAPortalTab | string {
  return MODULE_ACTIVE_TABS[moduleId] ?? moduleId;
}
