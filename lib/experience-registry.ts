/**
 * EA Experience Registry — executable EA Capability Map™ (Sprint 1B).
 *
 * Single source of truth for customer goals, navigation, dashboard zones, and Orbie policy.
 * Module technical fields (path, RBAC) remain in lib/modules/registry.ts.
 */
import type { ModuleId, NavGroup } from '@/lib/modules/registry';
import {
  ALL_MAGNIFI_TEMPLATE_IDS,
  getMagnifiTemplate,
  type MagnifiTemplateId,
} from '@/lib/ea-template-registry';

// ─── Lifecycle kinds (Experience Framework — Spec 018 direction) ─────────────

export const EXPERIENCE_LIFECYCLE_PHASES = [
  'discover',
  'engage',
  'convert',
  'prepare',
  'experience',
  'continue',
] as const;

export type ExperienceLifecyclePhase = (typeof EXPERIENCE_LIFECYCLE_PHASES)[number];

export const EXPERIENCE_LIFECYCLE_LABELS: Record<ExperienceLifecyclePhase, string> = {
  discover: 'Discover',
  engage: 'Engage',
  convert: 'Convert',
  prepare: 'Prepare',
  experience: 'Experience',
  continue: 'Continue',
};

export type ExperienceKindId =
  | 'client-transformation'
  | 'magnifi-consider'
  | 'connect-relationship'
  | 'portal-operating';

export type DisclosureLevel = 'L1' | 'L2' | 'L3' | 'L4';

export type DashboardZone = 'north-star' | 'today' | 'progress' | 'discovery' | 'none';

export type OrbiePolicy =
  | 'introduce'
  | 'recommend'
  | 'teach'
  | 'ignore'
  | 'contextual'
  | 'route-to-activity'
  | 'summarize';

export type CapabilityId =
  | 'command-view'
  | 'organization-health'
  | 'opportunity-capture'
  | 'amplification'
  | 'advisor-activity'
  | 'messaging'
  | 'ask-advisor'
  | 'your-build'
  | 'relationship-capture'
  | 'documents'
  | 'learning'
  | 'events'
  | 'resources'
  | 'billing'
  | 'guided-discovery'
  | 'landing-pages';

/** One row of the EA Capability Map™ — drives nav, dashboard metadata, and Orbie. */
export interface CapabilityDefinition {
  id: CapabilityId;
  moduleId: ModuleId;
  customerGoal: string;
  /** Sprint 2 primary label — not used for display until Phase 2. */
  plainLanguage: string;
  eaCapability: string;
  /** Current UI label (product names preserved for Sprint 1B). */
  displayLabel: string;
  poweredBy?: string;
  disclosureLevel: DisclosureLevel;
  navGroup: NavGroup;
  showInSidebar: boolean;
  showInPillNav: boolean;
  navTabId?: 'home' | 'pulse' | 'simplifi' | 'amplifi' | 'updates' | 'connect';
  dashboardZone: DashboardZone;
  showOnDashboardHub: boolean;
  hubVariant?: 'pulse' | 'amplifi' | 'simplifi' | 'default';
  orbPolicy: OrbiePolicy;
  /** Pathname fragments for Orbie / context resolution (first match wins). */
  routePatterns: string[];
}

export const CAPABILITY_REGISTRY: CapabilityDefinition[] = [
  {
    id: 'command-view',
    moduleId: 'dashboard',
    customerGoal: 'Know where I stand today',
    plainLanguage: 'Home',
    eaCapability: 'Command View',
    displayLabel: 'Dashboard',
    disclosureLevel: 'L1',
    navGroup: 'core',
    showInSidebar: true,
    showInPillNav: true,
    navTabId: 'home',
    dashboardZone: 'north-star',
    showOnDashboardHub: true,
    orbPolicy: 'introduce',
    routePatterns: ['/portal/login'],
  },
  {
    id: 'organization-health',
    moduleId: 'pulse',
    customerGoal: "Know how we're doing",
    plainLanguage: 'Progress',
    eaCapability: 'Organization Health & Signals',
    displayLabel: 'Pulse',
    poweredBy: 'Pulse™',
    disclosureLevel: 'L1',
    navGroup: 'core',
    showInSidebar: true,
    showInPillNav: true,
    navTabId: 'pulse',
    dashboardZone: 'progress',
    showOnDashboardHub: true,
    hubVariant: 'pulse',
    orbPolicy: 'summarize',
    routePatterns: ['/pulse'],
  },
  {
    id: 'opportunity-capture',
    moduleId: 'simplifi',
    customerGoal: 'Never lose an opportunity',
    plainLanguage: 'Capture',
    eaCapability: 'Opportunity Capture & Decide',
    displayLabel: 'Simplifi',
    poweredBy: 'Simplifi™',
    disclosureLevel: 'L1',
    navGroup: 'growth',
    showInSidebar: true,
    showInPillNav: true,
    navTabId: 'simplifi',
    dashboardZone: 'today',
    showOnDashboardHub: true,
    hubVariant: 'simplifi',
    orbPolicy: 'introduce',
    routePatterns: ['/simplifi'],
  },
  {
    id: 'amplification',
    moduleId: 'amplifi',
    customerGoal: 'Grow awareness & reach',
    plainLanguage: 'Amplify',
    eaCapability: 'Amplification & Distribution',
    displayLabel: 'Amplifi',
    poweredBy: 'Amplifi™',
    disclosureLevel: 'L1',
    navGroup: 'growth',
    showInSidebar: true,
    showInPillNav: true,
    navTabId: 'amplifi',
    dashboardZone: 'today',
    showOnDashboardHub: true,
    hubVariant: 'amplifi',
    orbPolicy: 'recommend',
    routePatterns: ['/amplifi'],
  },
  {
    id: 'advisor-activity',
    moduleId: 'update-hub',
    customerGoal: 'Talk to EA & see replies',
    plainLanguage: 'Activity',
    eaCapability: 'Advisor Communication & Feed',
    displayLabel: 'Updates',
    poweredBy: 'Update Hub™',
    disclosureLevel: 'L1',
    navGroup: 'core',
    showInSidebar: true,
    showInPillNav: true,
    navTabId: 'updates',
    dashboardZone: 'today',
    showOnDashboardHub: true,
    orbPolicy: 'recommend',
    routePatterns: ['/updates'],
  },
  {
    id: 'messaging',
    moduleId: 'messaging',
    customerGoal: 'Send a message to EA',
    plainLanguage: 'Send a message',
    eaCapability: 'Messaging',
    displayLabel: 'Messaging',
    disclosureLevel: 'L2',
    navGroup: 'operations',
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: 'none',
    showOnDashboardHub: true,
    orbPolicy: 'route-to-activity',
    routePatterns: ['/messaging', '/messages'],
  },
  {
    id: 'documents',
    moduleId: 'documents',
    customerGoal: 'Find shared files & materials',
    plainLanguage: 'Documents',
    eaCapability: 'Document Access',
    displayLabel: 'Document Hub™',
    disclosureLevel: 'L2',
    navGroup: 'operations',
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: 'none',
    showOnDashboardHub: true,
    orbPolicy: 'ignore',
    routePatterns: ['/documents'],
  },
  {
    id: 'learning',
    moduleId: 'training',
    customerGoal: 'Learn how to use the platform',
    plainLanguage: 'Learning',
    eaCapability: 'Training & Guides',
    displayLabel: 'Training Hub™',
    disclosureLevel: 'L2',
    navGroup: 'operations',
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: 'today',
    showOnDashboardHub: true,
    orbPolicy: 'teach',
    routePatterns: ['/learning', '/academy'],
  },
  {
    id: 'events',
    moduleId: 'events',
    customerGoal: 'See upcoming sessions',
    plainLanguage: 'Events',
    eaCapability: 'Scheduled Touchpoints',
    displayLabel: 'Event Hub™',
    disclosureLevel: 'L3',
    navGroup: 'operations',
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: 'none',
    showOnDashboardHub: true,
    orbPolicy: 'ignore',
    routePatterns: ['/events'],
  },
  {
    id: 'resources',
    moduleId: 'resources',
    customerGoal: 'Browse tools & templates',
    plainLanguage: 'Resources',
    eaCapability: 'Resource Library',
    displayLabel: 'Resource library',
    disclosureLevel: 'L3',
    navGroup: 'operations',
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: 'none',
    showOnDashboardHub: true,
    orbPolicy: 'ignore',
    routePatterns: ['/resources'],
  },
  {
    id: 'ask-advisor',
    moduleId: 'ask',
    customerGoal: 'Ask a quick question',
    plainLanguage: 'Ask a question',
    eaCapability: 'Advisor Q&A',
    displayLabel: 'Guide™',
    disclosureLevel: 'L2',
    navGroup: 'operations',
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: 'none',
    showOnDashboardHub: true,
    orbPolicy: 'route-to-activity',
    routePatterns: ['/ask'],
  },
  {
    id: 'relationship-capture',
    moduleId: 'connect',
    customerGoal: 'Track in-person connections',
    plainLanguage: 'Connect',
    eaCapability: 'Relationship Capture',
    displayLabel: 'Connect',
    disclosureLevel: 'L2',
    navGroup: 'growth',
    showInSidebar: true,
    showInPillNav: true,
    navTabId: 'connect',
    dashboardZone: 'none',
    showOnDashboardHub: true,
    orbPolicy: 'teach',
    routePatterns: ['/connect'],
  },
  {
    id: 'guided-discovery',
    moduleId: 'discovery',
    customerGoal: 'Understand my capacity',
    plainLanguage: 'Assessment',
    eaCapability: 'Operational MRI™',
    displayLabel: 'Discovery',
    disclosureLevel: 'L3',
    navGroup: 'growth',
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: 'none',
    showOnDashboardHub: true,
    orbPolicy: 'contextual',
    routePatterns: ['/assessment', '/discovery'],
  },
  {
    id: 'your-build',
    moduleId: 'ctp',
    customerGoal: 'See my build progress',
    plainLanguage: 'Your Build',
    eaCapability: 'Discovery & First Build',
    displayLabel: 'Consider the Possibilities',
    disclosureLevel: 'L1',
    navGroup: 'operations',
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: 'discovery',
    showOnDashboardHub: true,
    orbPolicy: 'contextual',
    routePatterns: ['/ctp'],
  },
  {
    id: 'landing-pages',
    moduleId: 'landing',
    customerGoal: 'Learn about EA offerings',
    plainLanguage: 'Learn about EA',
    eaCapability: 'Landing / Marketing',
    displayLabel: 'Landing Pages',
    disclosureLevel: 'L4',
    navGroup: 'growth',
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: 'none',
    showOnDashboardHub: true,
    orbPolicy: 'ignore',
    routePatterns: ['/preview/home', '/story'],
  },
  {
    id: 'billing',
    moduleId: 'billing',
    customerGoal: 'Manage subscription',
    plainLanguage: 'Billing',
    eaCapability: 'Subscription & Invoices',
    displayLabel: 'Billing',
    disclosureLevel: 'L2',
    navGroup: 'platform',
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: 'none',
    showOnDashboardHub: true,
    orbPolicy: 'ignore',
    routePatterns: ['/billing'],
  },
];

const CAPABILITY_BY_MODULE = new Map<ModuleId, CapabilityDefinition>(
  CAPABILITY_REGISTRY.map((c) => [c.moduleId, c]),
);

const CAPABILITY_BY_ID = new Map<CapabilityId, CapabilityDefinition>(
  CAPABILITY_REGISTRY.map((c) => [c.id, c]),
);

export function getCapabilityByModuleId(moduleId: ModuleId): CapabilityDefinition | undefined {
  return CAPABILITY_BY_MODULE.get(moduleId);
}

export function getCapabilityById(id: CapabilityId): CapabilityDefinition | undefined {
  return CAPABILITY_BY_ID.get(id);
}

export function listCapabilities(): CapabilityDefinition[] {
  return [...CAPABILITY_REGISTRY];
}

export function listCapabilitiesForModules(moduleIds: Iterable<ModuleId>): CapabilityDefinition[] {
  const ids = new Set(moduleIds);
  return CAPABILITY_REGISTRY.filter((c) => ids.has(c.moduleId));
}

/** Match pathname to a portal capability (module paths, then portal home). */
export function resolveCapabilityForPathname(pathname: string): CapabilityDefinition | undefined {
  const normalized = pathname.split('?')[0] ?? pathname;

  for (const cap of CAPABILITY_REGISTRY) {
    if (cap.moduleId === 'dashboard') continue;
    for (const pattern of cap.routePatterns) {
      if (normalized.includes(pattern)) return cap;
    }
  }

  if (/^\/portal\/[^/]+\/?$/.test(normalized) || normalized.includes('/portal/login')) {
    return getCapabilityByModuleId('dashboard');
  }

  return undefined;
}

export type CapabilityContext = {
  capabilityId: CapabilityId;
  moduleId: ModuleId;
  customerGoal: string;
  plainLanguage: string;
  displayLabel: string;
  eaCapability: string;
  route: string;
  dashboardZone: DashboardZone;
  orbPolicy: OrbiePolicy;
  poweredBy?: string;
};

export function toCapabilityContext(
  capability: CapabilityDefinition,
  pathname: string,
): CapabilityContext {
  return {
    capabilityId: capability.id,
    moduleId: capability.moduleId,
    customerGoal: capability.customerGoal,
    plainLanguage: capability.plainLanguage,
    displayLabel: capability.displayLabel,
    eaCapability: capability.eaCapability,
    route: pathname,
    dashboardZone: capability.dashboardZone,
    orbPolicy: capability.orbPolicy,
    poweredBy: capability.poweredBy,
  };
}

export function resolveCapabilityContext(pathname: string): CapabilityContext | undefined {
  const cap = resolveCapabilityForPathname(pathname);
  return cap ? toCapabilityContext(cap, pathname) : undefined;
}

export type DashboardCapabilityGroup = {
  zone: DashboardZone;
  label: string;
  capabilities: CapabilityContext[];
};

const DASHBOARD_ZONE_LABELS: Record<DashboardZone, string> = {
  'north-star': 'North Star',
  today: 'Today',
  progress: 'Progress',
  discovery: 'Discovery',
  none: 'Other',
};

export function groupDashboardCapabilities(
  capabilities: CapabilityDefinition[],
): DashboardCapabilityGroup[] {
  const order: DashboardZone[] = ['north-star', 'today', 'progress', 'discovery', 'none'];
  const grouped = new Map<DashboardZone, CapabilityDefinition[]>();

  for (const cap of capabilities) {
    if (cap.dashboardZone === 'none' && !cap.showOnDashboardHub) continue;
    const list = grouped.get(cap.dashboardZone) ?? [];
    list.push(cap);
    grouped.set(cap.dashboardZone, list);
  }

  return order
    .filter((zone) => grouped.has(zone))
    .map((zone) => ({
      zone,
      label: DASHBOARD_ZONE_LABELS[zone],
      capabilities: (grouped.get(zone) ?? []).map((c) =>
        toCapabilityContext(c, `/portal/{slug}/${c.moduleId === 'dashboard' ? '' : c.moduleId}`),
      ),
    }));
}

// ─── Experience kinds (funnel taxonomy — unchanged from Sprint 1) ────────────

export type ExperienceStatus = 'active' | 'partial' | 'planned';

export interface ExperiencePhaseBinding {
  label: string;
  route?: string;
  moduleId?: ModuleId;
}

export interface ExperienceCatalogEntry {
  id: ExperienceKindId;
  name: string;
  description: string;
  status: ExperienceStatus;
  audience: string;
  convertAction: string;
  integrations: string[];
  phases: Partial<Record<ExperienceLifecyclePhase, ExperiencePhaseBinding>>;
  magnifiTemplateIds?: MagnifiTemplateId[];
}

export const EXPERIENCE_CATALOG: Record<ExperienceKindId, ExperienceCatalogEntry> = {
  'client-transformation': {
    id: 'client-transformation',
    name: 'Client Transformation',
    description: 'CTP funnel — discovery through portal delivery and ongoing operations.',
    status: 'active',
    audience: 'EA clients purchasing transformation packages',
    convertAction: 'Submit discovery assessment',
    integrations: ['Stripe', 'Airtable', 'Make', 'Creative Studio'],
    magnifiTemplateIds: ALL_MAGNIFI_TEMPLATE_IDS,
    phases: {
      discover: { label: 'Consider share', route: '/consider/{slug}' },
      engage: { label: 'CTP Consider', route: 'https://cc.efficiencyarchitects.online/ctp' },
      convert: { label: 'Assessment submit', route: '/api/assessment/submit' },
      prepare: { label: 'Workspace provision', route: '/api/ctp/submissions/{id}/provision-workspace' },
      experience: { label: 'Portal CTP status', route: '/portal/{slug}/ctp', moduleId: 'ctp' },
      continue: { label: 'Portal operating rhythm', route: '/portal/{slug}', moduleId: 'dashboard' },
    },
  },
  'magnifi-consider': {
    id: 'magnifi-consider',
    name: 'Magnifi Consider',
    description: 'Shareable cinematic opportunity experience before commitment.',
    status: 'active',
    audience: 'Prospects evaluating EA transformation',
    convertAction: 'Start assessment or Simplifi capture',
    integrations: ['Airtable captures'],
    magnifiTemplateIds: ALL_MAGNIFI_TEMPLATE_IDS,
    phases: {
      discover: { label: 'Share link', route: '/magnifi/{id}' },
      engage: { label: 'Cinematic experience', route: '/magnifi/{id}' },
      convert: { label: 'CTA to assessment', route: '/assessment' },
      continue: { label: 'Simplifi guidance', route: '/simplifi/guidance/{id}' },
    },
  },
  'connect-relationship': {
    id: 'connect-relationship',
    name: 'Connect Relationship',
    description: 'QR/NFC relationship capture and nurture for events and communities.',
    status: 'active',
    audience: 'Organizations running events, recruiting, or community touchpoints',
    convertAction: 'Submit connection',
    integrations: ['Airtable Connect', 'Make nurture'],
    phases: {
      discover: { label: 'QR or NFC', route: '/connect/{org}' },
      engage: { label: 'Guided journey', route: '/connect/{org}/journey' },
      convert: { label: 'Relationship capture', route: '/api/connect/relationships' },
      experience: { label: 'Portal Connect', route: '/portal/{slug}/connect', moduleId: 'connect' },
      continue: { label: 'Nurture automations', route: '/api/admin/connect/run-nurture' },
    },
  },
  'portal-operating': {
    id: 'portal-operating',
    name: 'Portal Operating',
    description: 'Entitled client portal modules after package fulfillment.',
    status: 'active',
    audience: 'Paying EA clients',
    convertAction: 'Package purchase (Stripe)',
    integrations: ['Stripe', 'Entitlements', 'Pulse'],
    phases: {
      convert: { label: 'Checkout', route: '/checkout' },
      prepare: { label: 'Portal provision', route: '/api/webhooks/stripe' },
      experience: { label: 'Portal modules', route: '/portal/{slug}' },
      continue: { label: 'Pulse + updates', moduleId: 'pulse' },
    },
  },
};

export function listExperienceCatalog(): ExperienceCatalogEntry[] {
  return Object.values(EXPERIENCE_CATALOG);
}

export function getExperienceKind(id: ExperienceKindId): ExperienceCatalogEntry {
  return EXPERIENCE_CATALOG[id];
}

export function serializeExperienceCatalog() {
  return listExperienceCatalog().map((entry) => ({
    ...entry,
    magnifiTemplates: (entry.magnifiTemplateIds ?? []).map((id) => {
      const t = getMagnifiTemplate(id);
      return { id, name: t.name, audience: t.audience };
    }),
  }));
}
