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

export const SIMPLIFI_SUBSCRIPTION_MODULES = [
  ...EA_CLIENT_MODULES,
  'billing',
] as const;

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
] as const;

export const IMPLEMENTATION_MODULES = [
  ...EA_CLIENT_MODULES,
  'connect',
] as const;

export const SIMPLIFI_ONE_TIME_MODULES = [...EA_CLIENT_MODULES] as const;

/** Lean client portal modules for automated website + portal starter. */
export const WEBSITE_PORTAL_MODULES = [
  'dashboard',
  'landing',
  'pulse',
  'ctp',
  'update-hub',
  'messaging',
  'documents',
  'training',
  'resources',
  'ask',
  'connect',
] as const;

export const PLATFORM_MONTHLY_MODULES = [
  ...EA_CLIENT_MODULES,
  'billing',
] as const;

export const PLATFORM_ANNUAL_MODULES = [
  ...EA_CLIENT_MODULES,
  'billing',
  'connect',
] as const;

/** Coarse Airtable Package Purchased ? module entitlements (fallback path). */
export const AIRTABLE_PACKAGE_MODULES: Record<string, readonly string[]> = {
  'Launch Verification': LAUNCH_VERIFICATION_MODULES,
  Simplifi: SIMPLIFI_ONE_TIME_MODULES,
  'Implementation Package': IMPLEMENTATION_MODULES,
  'Capacity Assessment': CAPACITY_MODULES,
  'Capacity Blueprint': CAPACITY_MODULES,
  'Website + Portal Starter': WEBSITE_PORTAL_MODULES,
};

export const DEMO_MODULE_IDS = ['discovery', 'connect', 'landing'] as const;
