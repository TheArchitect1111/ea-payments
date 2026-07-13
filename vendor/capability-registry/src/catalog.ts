/**
 * Seed capability catalog — metadata for marketplace + module-engine discovery.
 * Status Certified only where multi-consumer evidence exists.
 */

import type { CapabilityManifest } from './types';
import { CAPABILITY_ID_MAP } from './id-map';

function baseFromMap(
  capabilityId: string,
  overrides: Partial<CapabilityManifest> &
    Pick<CapabilityManifest, 'name' | 'description' | 'purpose' | 'category' | 'status'>,
): CapabilityManifest {
  const row = CAPABILITY_ID_MAP.find((r) => r.capabilityId === capabilityId);
  return {
    id: capabilityId,
    version: '0.1.0',
    status: overrides.status,
    category: overrides.category,
    name: overrides.name,
    description: overrides.description,
    purpose: overrides.purpose,
    moduleId: row?.moduleId,
    enableKey: row?.enableKey,
    hubModuleId: row?.hubModuleId,
    dependencies: overrides.dependencies ?? [],
    certified: overrides.certified ?? false,
    consumers: overrides.consumers ?? [],
    potentialConsumers: overrides.potentialConsumers,
    owner: overrides.owner ?? 'EA Platform',
    documentation: overrides.documentation,
    configuration: overrides.configuration,
    permissions: overrides.permissions ?? [],
    routes: overrides.routes ?? [],
    apis: overrides.apis,
    widgets: overrides.widgets ?? [],
    dashboardCards: overrides.dashboardCards,
    navigation: overrides.navigation,
    aiSkills: overrides.aiSkills ?? [],
    healthChecks: overrides.healthChecks,
    featureFlags: overrides.featureFlags,
    databaseTables: overrides.databaseTables,
    requiredServices: overrides.requiredServices,
    currentRepositories: overrides.currentRepositories,
    currentFiles: overrides.currentFiles,
    reusable: overrides.reusable ?? true,
    reuseEvidence: overrides.reuseEvidence,
    extractionEffort: overrides.extractionEffort,
    riskLevel: overrides.riskLevel,
    recommendedPriority: overrides.recommendedPriority,
  };
}

/** Seed catalog for platform foundation (v0.1). */
export const CAPABILITY_CATALOG: CapabilityManifest[] = [
  baseFromMap('command-view', {
    name: 'Command View',
    description: 'Operational home dashboard for authenticated portals.',
    purpose: 'Give every tenant a single north-star view of status and next actions.',
    category: 'Dashboard',
    status: 'Certified',
    certified: true,
    consumers: ['ea-payments', 'cpr'],
    reuseEvidence: 'EA portal dashboard + CPR hub dashboard',
    dependencies: ['authentication'],
    routes: [{ path: '/portal/[slug]', description: 'Portal home' }],
    navigation: [{ label: 'Home', path: '', group: 'core' }],
    widgets: [{ id: 'command-north-star', title: 'Command view', zone: 'north-star' }],
    aiSkills: [
      {
        id: 'summarize-today',
        description: 'Summarize what needs attention today',
        examples: ['What needs my attention?', 'Where do we stand?'],
      },
    ],
    currentRepositories: ['ea-launch-audit/ea-payments', 'cpr-governance-baseline'],
    currentFiles: [
      'lib/modules/registry.ts',
      'lib/experience-registry.ts',
      'lib/portal-hub-modules.ts',
    ],
    extractionEffort: 'M',
    riskLevel: 'low',
    recommendedPriority: 'P1',
  }),
  baseFromMap('organization-health', {
    name: 'Pulse™',
    description: 'Organization health, signals, and bottlenecks.',
    purpose: 'Surface visibility intelligence in one calm view.',
    category: 'Analytics',
    status: 'Development',
    certified: false,
    consumers: ['ea-payments'],
    potentialConsumers: ['cpr', '3hc'],
    dependencies: ['authentication', 'organizations'],
    routes: [{ path: '/portal/[slug]/pulse' }],
    aiSkills: [
      {
        id: 'pulse-summary',
        description: 'Explain health scores and bottlenecks',
        examples: ['How are we doing?', 'What is blocking us?'],
      },
    ],
    currentRepositories: ['ea-launch-audit/ea-payments'],
    extractionEffort: 'L',
    riskLevel: 'medium',
    recommendedPriority: 'P2',
  }),
  baseFromMap('messaging', {
    name: 'Messaging',
    description: 'Direct messaging between members and advisors.',
    purpose: 'Centralize conversation without leaving the portal.',
    category: 'Messaging',
    status: 'Certified',
    certified: true,
    consumers: ['ea-payments', 'cpr'],
    reuseEvidence: 'Portal messaging routes in EA and CPR',
    dependencies: ['authentication', 'users', 'notifications'],
    routes: [{ path: '/portal/[slug]/messaging' }],
    aiSkills: [
      {
        id: 'unread-messages',
        description: 'List unread or stalled threads',
        examples: ['Any unread messages?', 'Who am I waiting on?'],
      },
    ],
    currentRepositories: ['ea-launch-audit/ea-payments', 'cpr-governance-baseline'],
    extractionEffort: 'M',
    riskLevel: 'medium',
    recommendedPriority: 'P3',
  }),
  baseFromMap('documents', {
    name: 'Document Hub™',
    description: 'Shared document vault for assessments, agreements, and materials.',
    purpose: 'Store and retrieve tenant documents with role gating.',
    category: 'Documents',
    status: 'Certified',
    certified: true,
    consumers: ['ea-payments', 'cpr'],
    reuseEvidence: 'Document vault in EA portal and CPR',
    dependencies: ['authentication', 'storage'],
    routes: [{ path: '/portal/[slug]/documents' }],
    aiSkills: [
      {
        id: 'missing-docs',
        description: 'Identify missing or expired documents',
        examples: ['What documents are missing?', 'Any expired files?'],
      },
    ],
    requiredServices: ['vercel-blob'],
    currentRepositories: ['ea-launch-audit/ea-payments', 'cpr-governance-baseline'],
    extractionEffort: 'M',
    riskLevel: 'medium',
    recommendedPriority: 'P3',
  }),
  baseFromMap('learning', {
    name: 'Training Hub™',
    description: 'Learning paths, guides, and training modules.',
    purpose: 'Deliver reusable training experiences per tenant.',
    category: 'Training',
    status: 'Development',
    certified: false,
    consumers: ['ea-payments', 'cpr'],
    potentialConsumers: ['3hc', 'bob-rumball', 'etfm'],
    reuseEvidence: 'Training routes in EA/CPR; content models in Bob Rumball / training-transformation',
    dependencies: ['authentication', 'profiles'],
    routes: [{ path: '/portal/[slug]/learning' }],
    aiSkills: [
      {
        id: 'training-progress',
        description: 'Report completion and overdue training',
        examples: ['Who is overdue on training?', 'Completion rates?'],
      },
    ],
    currentRepositories: [
      'ea-launch-audit/ea-payments',
      'cpr-governance-baseline',
      'ea-operating-system/bobrumball-experience-lab',
      'ea-training-transformation',
    ],
    extractionEffort: 'L',
    riskLevel: 'medium',
    recommendedPriority: 'P3',
  }),
  baseFromMap('billing', {
    name: 'Billing & Payments',
    description: 'Subscriptions, invoices, and payment status.',
    purpose: 'Unify commerce across package checkout and staged fees.',
    category: 'Payments',
    status: 'Development',
    certified: false,
    consumers: ['ea-payments', 'cpr'],
    reuseEvidence: 'Stripe checkout in EA catalog and CPR fee stages — contracts differ',
    dependencies: ['authentication', 'organizations', 'users', 'notifications', 'documents'],
    routes: [
      { path: '/portal/[slug]/billing' },
      { path: '/pay' },
    ],
    apis: [
      { path: '/api/checkout', method: 'POST' },
      { path: '/api/payments/checkout', method: 'POST' },
      { path: '/api/webhooks/stripe', method: 'POST' },
    ],
    aiSkills: [
      {
        id: 'payment-status',
        description: 'Outstanding balances and payment failures',
        examples: ['Any failed payments?', 'Outstanding balances?'],
      },
    ],
    requiredServices: ['stripe'],
    currentRepositories: ['ea-launch-audit/ea-payments', 'cpr-governance-baseline'],
    extractionEffort: 'XL',
    riskLevel: 'high',
    recommendedPriority: 'P3',
  }),
  baseFromMap('ask-advisor', {
    name: 'AI Advisor / Guide™',
    description: 'Advisor Q&A and AI context entry point.',
    purpose: 'Let each capability register AI knowledge for tenant-safe answers.',
    category: 'AI Advisor',
    status: 'Development',
    certified: false,
    consumers: ['ea-payments', 'cpr'],
    dependencies: ['authentication'],
    routes: [{ path: '/portal/[slug]/ask' }],
    aiSkills: [
      {
        id: 'route-question',
        description: 'Route questions to the right capability skill',
        examples: ['Ask a quick question'],
      },
    ],
    currentRepositories: ['ea-launch-audit/ea-payments', 'cpr-governance-baseline'],
    extractionEffort: 'M',
    riskLevel: 'medium',
    recommendedPriority: 'P2',
  }),
  baseFromMap('amplification', {
    name: 'Amplifi™',
    description: 'Amplification narrative, publishing, and distribution.',
    purpose: 'Grow awareness through approved communications.',
    category: 'Messaging',
    status: 'Development',
    consumers: ['ea-payments', 'cpr'],
    potentialConsumers: ['ea-communications-chassis'],
    dependencies: ['authentication', 'approvals'],
    routes: [{ path: '/portal/[slug]/amplifi' }],
    currentRepositories: ['ea-launch-audit/ea-payments', 'cpr-governance-baseline'],
    extractionEffort: 'L',
    riskLevel: 'medium',
    recommendedPriority: 'P4',
  }),
  baseFromMap('advisor-activity', {
    name: 'Update Hub™',
    description: 'Activity feed for captures, outreach, and advisor updates.',
    purpose: 'One timeline for operational activity.',
    category: 'Notifications',
    status: 'Development',
    consumers: ['ea-payments', 'cpr'],
    potentialConsumers: ['etfm', '3hc', 'bob-rumball'],
    dependencies: ['authentication'],
    routes: [{ path: '/portal/[slug]/updates' }],
    currentRepositories: ['ea-launch-audit/ea-payments', 'cpr-governance-baseline'],
    extractionEffort: 'M',
    riskLevel: 'low',
    recommendedPriority: 'P2',
  }),
  baseFromMap('events', {
    name: 'Event Hub™',
    description: 'Upcoming sessions, camps, and scheduled touchpoints.',
    purpose: 'Shared calendar/events surface across tenants.',
    category: 'Events',
    status: 'Development',
    consumers: ['ea-payments', 'cpr', 'SisterHub'],
    reuseEvidence: 'Events in EA, CPR, SisterHub',
    dependencies: ['authentication'],
    routes: [{ path: '/portal/[slug]/events' }],
    extractionEffort: 'M',
    riskLevel: 'low',
    recommendedPriority: 'P3',
  }),
  baseFromMap('recruiting', {
    name: 'Recruiting Timeline',
    description: 'Athlete recruiting progress, schools, and outreach.',
    purpose: 'CPR vertical recruiting operations.',
    category: 'Recruiting',
    status: 'Development',
    reusable: false,
    certified: false,
    consumers: ['cpr'],
    potentialConsumers: ['template-sports-recruitment'],
    reuseEvidence: 'Single vertical product — extract as vertical pack, not core engine',
    dependencies: ['player-profiles', 'documents', 'messaging'],
    currentRepositories: ['cpr-governance-baseline'],
    extractionEffort: 'L',
    riskLevel: 'medium',
    recommendedPriority: 'later',
  }),
  baseFromMap('eligibility', {
    name: 'Eligibility Center',
    description: 'Academic eligibility readiness and missing requirements.',
    purpose: 'CPR eligibility workflow.',
    category: 'Eligibility',
    status: 'Development',
    reusable: false,
    consumers: ['cpr'],
    dependencies: ['player-profiles', 'documents'],
    currentRepositories: ['cpr-governance-baseline'],
    extractionEffort: 'M',
    riskLevel: 'medium',
    recommendedPriority: 'later',
  }),
  baseFromMap('evidence-library', {
    name: 'Evidence Library',
    description: 'Compliance evidence, policies, and audit readiness materials.',
    purpose: 'Support 3HC / Bob Rumball compliance workspaces.',
    category: 'Compliance',
    status: 'Planning',
    reusable: true,
    consumers: [],
    potentialConsumers: ['3hc', 'bob-rumball'],
    dependencies: ['documents', 'learning'],
    extractionEffort: 'L',
    riskLevel: 'medium',
    recommendedPriority: 'P4',
  }),
  baseFromMap('financial-blueprint', {
    name: 'Financial Blueprint',
    description: 'Assessment-backed financial coaching action plans.',
    purpose: 'ETFM coaching outcomes after snapshot assessment.',
    category: 'Assessments',
    status: 'Planning',
    consumers: [],
    potentialConsumers: ['etfm'],
    dependencies: ['guided-discovery', 'documents', 'billing'],
    currentRepositories: ['ETFM-ASSESSMENT-'],
    extractionEffort: 'L',
    riskLevel: 'medium',
    recommendedPriority: 'P4',
  }),
  baseFromMap('player-profiles', {
    name: 'Player Profiles',
    description: 'Athlete profile records for recruiting platforms.',
    purpose: 'CPR athlete CRM core entity.',
    category: 'Profiles',
    status: 'Development',
    reusable: false,
    consumers: ['cpr'],
    dependencies: ['authentication', 'registration'],
    currentRepositories: ['cpr-governance-baseline'],
    databaseTables: ['Athletes (Airtable)'],
    extractionEffort: 'L',
    riskLevel: 'high',
    recommendedPriority: 'later',
  }),
];

const byId = new Map(CAPABILITY_CATALOG.map((c) => [c.id, c]));

export function getCapabilityManifest(id: string): CapabilityManifest | undefined {
  return byId.get(id);
}

export function listCapabilityManifests(filter?: {
  status?: CapabilityManifest['status'];
  category?: CapabilityManifest['category'];
  certifiedOnly?: boolean;
  reusableOnly?: boolean;
}): CapabilityManifest[] {
  return CAPABILITY_CATALOG.filter((c) => {
    if (filter?.status && c.status !== filter.status) return false;
    if (filter?.category && c.category !== filter.category) return false;
    if (filter?.certifiedOnly && !c.certified) return false;
    if (filter?.reusableOnly && !c.reusable) return false;
    return true;
  });
}

export function listCertifiedCapabilities(): CapabilityManifest[] {
  return listCapabilityManifests({ certifiedOnly: true });
}
