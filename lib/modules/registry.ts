import type { PlatformRole } from '@/lib/rbac';

/** Canonical module ids for the EA Platform Chassis. */
export const MODULE_IDS = [
  'dashboard',
  'pulse',
  'simplifi',
  'amplifi',
  'connect',
  'update-hub',
  'training',
  'landing',
  'discovery',
  'documents',
  'messaging',
  'events',
  'resources',
  'ask',
  'billing',
  'ctp',
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

export type NavGroup = 'core' | 'growth' | 'operations' | 'platform';

export type ModuleDefinition = {
  id: ModuleId;
  name: string;
  tag: string;
  title: string;
  description: string;
  navGroup: NavGroup;
  /** Shown in top pill nav when enabled */
  showInNav: boolean;
  navLabel?: string;
  navTabId?: 'home' | 'pulse' | 'simplifi' | 'amplifi' | 'updates' | 'connect';
  variant?: 'pulse' | 'amplifi' | 'simplifi' | 'default';
  requiredRole: PlatformRole;
  /** Relative path segment under /portal/{slug} — empty for dashboard */
  pathSegment: string;
  demoOnly?: boolean;
};

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    tag: 'Dashboard',
    title: 'Your command view',
    description: 'Operational health, account status, and your latest share links.',
    navGroup: 'core',
    showInNav: true,
    navLabel: 'Dashboard',
    navTabId: 'home',
    requiredRole: 'guest',
    pathSegment: '',
  },
  {
    id: 'pulse',
    name: 'Pulse™',
    tag: 'Pulse™',
    title: 'Visibility & intelligence',
    description: 'Scores, bottlenecks, capacity, and what needs attention — one calm view.',
    navGroup: 'core',
    showInNav: true,
    navLabel: 'Pulse',
    navTabId: 'pulse',
    variant: 'pulse',
    requiredRole: 'guest',
    pathSegment: 'pulse',
  },
  {
    id: 'simplifi',
    name: 'Simplifi™',
    tag: 'Simplifi™',
    title: 'Capture & decide',
    description: 'Paste any URL, score the opportunity, and launch Magnifi automatically.',
    navGroup: 'growth',
    showInNav: true,
    navLabel: 'Simplifi',
    navTabId: 'simplifi',
    variant: 'simplifi',
    requiredRole: 'staff',
    pathSegment: 'simplifi',
  },
  {
    id: 'amplifi',
    name: 'Amplifi™',
    tag: 'Amplifi™',
    title: 'Amplify & share',
    description: 'Your amplification narrative, stats, and links to Magnifi experiences.',
    navGroup: 'growth',
    showInNav: true,
    navLabel: 'Amplifi',
    navTabId: 'amplifi',
    variant: 'amplifi',
    requiredRole: 'guest',
    pathSegment: 'amplifi',
  },
  {
    id: 'update-hub',
    name: 'Update Hub™',
    tag: 'Update Hub™',
    title: 'Activity feed',
    description: 'Captures, outreach, enhancements, and advisor updates in one timeline.',
    navGroup: 'core',
    showInNav: true,
    navLabel: 'Updates',
    navTabId: 'updates',
    requiredRole: 'guest',
    pathSegment: 'updates',
  },
  {
    id: 'messaging',
    name: 'Messaging',
    tag: 'Communication',
    title: 'Messaging center',
    description: 'Direct messages with your EA advisor team.',
    navGroup: 'operations',
    showInNav: false,
    requiredRole: 'guest',
    pathSegment: 'messaging',
  },
  {
    id: 'documents',
    name: 'Document Hub™',
    tag: 'Document Hub™',
    title: 'Document vault',
    description: 'Assessments, agreements, scorecards, and onboarding materials.',
    navGroup: 'operations',
    showInNav: false,
    requiredRole: 'guest',
    pathSegment: 'documents',
  },
  {
    id: 'training',
    name: 'Training Hub™',
    tag: 'Training Hub™',
    title: 'Training & learning',
    description: 'Guides, modules, and resources for your transformation journey.',
    navGroup: 'operations',
    showInNav: false,
    requiredRole: 'guest',
    pathSegment: 'learning',
  },
  {
    id: 'events',
    name: 'Event Hub™',
    tag: 'Event Hub™',
    title: 'Upcoming events',
    description: 'Office hours, review calls, and scheduled touchpoints.',
    navGroup: 'operations',
    showInNav: false,
    requiredRole: 'guest',
    pathSegment: 'events',
  },
  {
    id: 'resources',
    name: 'Resource library',
    tag: 'Resource library',
    title: 'Tools & templates',
    description: 'Magnifi templates, workspace links, and curated resources.',
    navGroup: 'operations',
    showInNav: false,
    requiredRole: 'guest',
    pathSegment: 'resources',
  },
  {
    id: 'ask',
    name: 'Guide™',
    tag: 'Guide™',
    title: 'Ask your advisor',
    description: 'Submit questions directly to your Efficiency Architects team.',
    navGroup: 'operations',
    showInNav: false,
    requiredRole: 'guest',
    pathSegment: 'ask',
  },
  {
    id: 'connect',
    name: 'EA Connect™',
    tag: 'Connect™',
    title: 'Relationship capture',
    description: 'QR, NFC, and guided journeys that turn conversations into relationships.',
    navGroup: 'growth',
    showInNav: true,
    navTabId: 'connect',
    navLabel: 'Connect',
    requiredRole: 'staff',
    pathSegment: 'connect',
  },
  {
    id: 'discovery',
    name: 'Discovery',
    tag: 'Operational MRI™',
    title: 'Guided discovery',
    description: 'Capacity assessment and transformation scoping for your organization.',
    navGroup: 'growth',
    showInNav: false,
    requiredRole: 'guest',
    pathSegment: 'discovery',
    demoOnly: true,
  },
  {
    id: 'ctp',
    name: 'Consider the Possibilities',
    tag: 'CTP™',
    title: 'Your discovery journey',
    description: 'Track workspace, design studio, and review progress from your Consider submission.',
    navGroup: 'operations',
    showInNav: false,
    requiredRole: 'guest',
    pathSegment: 'ctp',
  },
  {
    id: 'landing',
    name: 'Landing Pages',
    tag: 'Landing Pages',
    title: 'Landing page experiences',
    description: 'Cinematic marketing journeys designed for your mission.',
    navGroup: 'growth',
    showInNav: false,
    requiredRole: 'admin',
    pathSegment: 'landing',
  },
  {
    id: 'billing',
    name: 'Billing',
    tag: 'Billing',
    title: 'Subscription & invoices',
    description: 'Manage your plan, payment method, and billing history.',
    navGroup: 'platform',
    showInNav: false,
    requiredRole: 'owner',
    pathSegment: 'billing',
  },
];

const REGISTRY_BY_ID = new Map(MODULE_REGISTRY.map((m) => [m.id, m]));

export function getModuleDefinition(moduleId: ModuleId): ModuleDefinition | undefined {
  return REGISTRY_BY_ID.get(moduleId);
}

export function moduleHref(slug: string, module: ModuleDefinition): string {
  const base = `/portal/${slug}`;
  if (!module.pathSegment) return base;
  if (module.demoOnly && module.id === 'discovery') return '/assessment';
  return `${base}/${module.pathSegment}`;
}

/** Preset bundles aligned with tenant-configs — used when no Airtable entitlements exist. */
export const TENANT_MODULE_PRESETS: Record<string, ModuleId[]> = {
  'ea-client': [
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
  ],
  'family-hub': [
    'dashboard',
    'update-hub',
    'training',
    'documents',
    'messaging',
    'events',
    'resources',
  ],
};

/** Package-based extras merged onto the ea-client preset. */
export const PACKAGE_MODULE_GRANTS: Record<string, ModuleId[]> = {
  Simplifi: ['simplifi', 'amplifi'],
  'Implementation Package': ['simplifi', 'amplifi', 'connect'],
  'Capacity Assessment': ['dashboard', 'pulse', 'update-hub', 'documents', 'ask', 'discovery', 'ctp'],
  'Capacity Blueprint': ['dashboard', 'pulse', 'update-hub', 'documents', 'ask', 'discovery', 'ctp'],
  'Launch Verification': ['dashboard', 'pulse', 'update-hub', 'ask'],
};

export const DEMO_MODULE_IDS: ModuleId[] = [
  'discovery',
  'connect',
  'landing',
];

export function defaultModulesForPackage(
  packagePurchased: string,
  options?: { isDemo?: boolean; tenantPreset?: string },
): ModuleId[] {
  const preset = TENANT_MODULE_PRESETS[options?.tenantPreset ?? 'ea-client'] ?? TENANT_MODULE_PRESETS['ea-client'];
  const grants = PACKAGE_MODULE_GRANTS[packagePurchased] ?? [];
  const ids = new Set<ModuleId>([...preset, ...grants]);

  if (options?.isDemo) {
    DEMO_MODULE_IDS.forEach((id) => ids.add(id));
  }

  if (packagePurchased === 'Launch Verification') {
    return PACKAGE_MODULE_GRANTS['Launch Verification'] ?? ['dashboard', 'pulse', 'update-hub', 'ask'];
  }

  return [...ids];
}
