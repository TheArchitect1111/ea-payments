/** Shared module presets used by commerce offers (portal ModuleId strings). */
export const EA_CLIENT_MODULES = [
  'dashboard',
  'pulse',
  'simplifi',
  'amplifi',
  'update-hub',
  'messaging',
  'documents',
  'training',
  'events',
  'resources',
  'ask',
] as const;

/** Launch Edition mandatory core modules (Calendar + Events plan). */
export const LAUNCH_EDITION_MODULES = [
  'dashboard',
  'update-hub',
  'documents',
  'events',
  'billing',
  'settings',
  'intake',
  'applications',
  'reports',
] as const;

export function ensureLaunchEditionModules(ids: string[]): string[] {
  return [...new Set([...ids, ...LAUNCH_EDITION_MODULES])];
}

export const SIMPLIFI_SUBSCRIPTION_MODULES = ensureLaunchEditionModules([
  ...EA_CLIENT_MODULES,
  'billing',
]) as readonly string[];

export const LAUNCH_VERIFICATION_MODULES = [
  'dashboard',
  'pulse',
  'update-hub',
  'ask',
] as const;

export const CAPACITY_MODULES = [
  ...EA_CLIENT_MODULES,
  'discovery',
  'ctp',
  'reports',
] as const;

export const IMPLEMENTATION_MODULES = ensureLaunchEditionModules([
  ...EA_CLIENT_MODULES,
  'connect',
  'member',
]) as readonly string[];

export const SIMPLIFI_ONE_TIME_MODULES = [...EA_CLIENT_MODULES] as const;

/** Lean client portal modules for automated website + portal starter. */
export const WEBSITE_PORTAL_MODULES = ensureLaunchEditionModules([
  'dashboard',
  'landing',
  'pulse',
  'ctp',
  'member',
  'update-hub',
  'messaging',
  'documents',
  'events',
  'training',
  'resources',
  'ask',
  'connect',
]) as readonly string[];

export const PLATFORM_MONTHLY_MODULES = ensureLaunchEditionModules([
  ...EA_CLIENT_MODULES,
  'billing',
]) as readonly string[];

export const PLATFORM_ANNUAL_MODULES = ensureLaunchEditionModules([
  ...EA_CLIENT_MODULES,
  'billing',
  'connect',
]) as readonly string[];

/** Coarse Airtable Package Purchased ? module entitlements (fallback path). */
export const AIRTABLE_PACKAGE_MODULES: Record<string, readonly string[]> = {
  'Launch Verification': LAUNCH_VERIFICATION_MODULES,
  Simplifi: SIMPLIFI_ONE_TIME_MODULES,
  'Implementation Package': IMPLEMENTATION_MODULES,
  'Capacity Assessment': CAPACITY_MODULES,
  'Capacity Blueprint': CAPACITY_MODULES,
  'Website + Portal Starter': WEBSITE_PORTAL_MODULES,
  'Launch Edition': LAUNCH_EDITION_MODULES,
};

export const DEMO_MODULE_IDS = ['discovery', 'connect', 'landing'] as const;
