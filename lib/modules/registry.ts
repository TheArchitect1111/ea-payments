import { resolveModuleEntitlements } from '@ea/payments-contract';
import type { PlatformRole } from '@/lib/rbac';
import { getCapabilityByModuleId } from '@/lib/experience-registry';

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
  'member',
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

type TechnicalModuleDefinition = Omit<
  ModuleDefinition,
  'navGroup' | 'showInNav' | 'navLabel' | 'navTabId'
>;

const TECHNICAL_MODULE_REGISTRY: TechnicalModuleDefinition[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    tag: 'Dashboard',
    title: 'Your command view',
    description: 'Operational health, account status, and your latest share links.',
    requiredRole: 'guest',
    pathSegment: '',
  },
  {
    id: 'pulse',
    name: 'Pulse™',
    tag: 'Pulse™',
    title: 'Visibility & intelligence',
    description: 'Scores, bottlenecks, capacity, and what needs attention — one calm view.',
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
    requiredRole: 'guest',
    pathSegment: 'updates',
  },
  {
    id: 'messaging',
    name: 'Messaging',
    tag: 'Communication',
    title: 'Messaging center',
    description: 'Direct messages with your EA advisor team.',
    requiredRole: 'guest',
    pathSegment: 'messaging',
  },
  {
    id: 'documents',
    name: 'Document Hub™',
    tag: 'Document Hub™',
    title: 'Document vault',
    description: 'Assessments, agreements, scorecards, and onboarding materials.',
    requiredRole: 'guest',
    pathSegment: 'documents',
  },
  {
    id: 'training',
    name: 'Training Hub™',
    tag: 'Training Hub™',
    title: 'Training & learning',
    description: 'Guides, modules, and resources for your transformation journey.',
    requiredRole: 'guest',
    pathSegment: 'learning',
  },
  {
    id: 'events',
    name: 'Event Hub™',
    tag: 'Event Hub™',
    title: 'Upcoming events',
    description: 'Office hours, review calls, and scheduled touchpoints.',
    requiredRole: 'guest',
    pathSegment: 'events',
  },
  {
    id: 'resources',
    name: 'Resource library',
    tag: 'Resource library',
    title: 'Tools & templates',
    description: 'Magnifi templates, workspace links, and curated resources.',
    requiredRole: 'guest',
    pathSegment: 'resources',
  },
  {
    id: 'ask',
    name: 'Guide™',
    tag: 'Guide™',
    title: 'Ask your advisor',
    description: 'Submit questions directly to your Efficiency Architects team.',
    requiredRole: 'guest',
    pathSegment: 'ask',
  },
  {
    id: 'connect',
    name: 'EA Connect™',
    tag: 'Connect™',
    title: 'Relationship capture',
    description: 'QR, NFC, and guided journeys that turn conversations into relationships.',
    requiredRole: 'staff',
    pathSegment: 'connect',
  },
  {
    id: 'discovery',
    name: 'Discovery',
    tag: 'Operational MRI™',
    title: 'Guided discovery',
    description: 'Capacity assessment and transformation scoping for your organization.',
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
    requiredRole: 'guest',
    pathSegment: 'ctp',
  },
  {
    id: 'member',
    name: 'Member Experience',
    tag: 'Member',
    title: 'Member home',
    description: 'Persona-shaped home with the tiles and next steps your members actually need.',
    requiredRole: 'guest',
    pathSegment: 'member',
  },
  {
    id: 'landing',
    name: 'Landing Pages',
    tag: 'Landing Pages',
    title: 'Landing page experiences',
    description: 'Cinematic marketing journeys designed for your mission.',
    requiredRole: 'admin',
    pathSegment: 'landing',
  },
  {
    id: 'billing',
    name: 'Billing',
    tag: 'Billing',
    title: 'Subscription & invoices',
    description: 'Manage your plan, payment method, and billing history.',
    requiredRole: 'owner',
    pathSegment: 'billing',
  },
];

function mergeModuleWithCapability(technical: TechnicalModuleDefinition): ModuleDefinition {
  const capability = getCapabilityByModuleId(technical.id);
  if (!capability) {
    throw new Error(`Missing capability map entry for module: ${technical.id}`);
  }

  return {
    ...technical,
    navGroup: capability.navGroup,
    showInNav: capability.showInPillNav,
    navLabel: capability.displayLabel,
    navTabId: capability.navTabId,
    variant: capability.hubVariant ?? technical.variant,
  };
}

/** Portal modules — navigation fields sourced from EA Capability Map (experience-registry). */
export const MODULE_REGISTRY: ModuleDefinition[] = TECHNICAL_MODULE_REGISTRY.map(mergeModuleWithCapability);

for (const moduleId of MODULE_IDS) {
  if (!getCapabilityByModuleId(moduleId)) {
    throw new Error(`EA Capability Map missing entry for module: ${moduleId}`);
  }
}

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
  'Implementation Package': ['simplifi', 'amplifi', 'connect', 'member'],
  'Website + Portal Starter': ['member'],
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
  // Canonical source: @ea/payments-contract (Airtable package or offer id).
  const fromContract = resolveModuleEntitlements(packagePurchased, {
    isDemo: options?.isDemo,
  }) as ModuleId[];
  if (fromContract.length > 0) {
    // Non-ea tenant presets still merge contract grants onto the requested preset.
    if (options?.tenantPreset && options.tenantPreset !== 'ea-client') {
      const preset =
        TENANT_MODULE_PRESETS[options.tenantPreset] ?? TENANT_MODULE_PRESETS['ea-client'];
      return [...new Set<ModuleId>([...preset, ...fromContract])];
    }
    return fromContract;
  }

  // Legacy fallback if package name is unknown to the contract.
  const preset =
    TENANT_MODULE_PRESETS[options?.tenantPreset ?? 'ea-client'] ??
    TENANT_MODULE_PRESETS['ea-client'];
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
