import { ADMIN_COMMANDS } from '@/lib/admin-command-registry';
import { listAtlasObjects } from '@/lib/atlas';
import { listExecutiveCapabilities } from '@/lib/executive-capabilities';
import { getDecisionIntelligence } from '@/lib/executive-decision-intelligence';
import { getExecutiveIntelligence } from '@/lib/executive-intelligence';
import { getOperationsVisibility, getOrganization360Summaries } from '@/lib/executive-operations';
import { EXPERIENCE_REGISTRY } from '@/lib/experience-registry';
import { listKnowledgeAssets } from '@/lib/knowledge-center';
import { getProductOperationsSummaries } from '@/lib/product-operations';

export type ExecutiveCommandType =
  | 'Action'
  | 'Organization'
  | 'Capability'
  | 'Knowledge Asset'
  | 'Operation'
  | 'Executive Intelligence'
  | 'Decision Intelligence'
  | 'Atlas Object'
  | 'Product'
  | 'Experience'
  | 'Blueprint'
  | 'Assessment'
  | 'Training'
  | 'Policy'
  | 'Document'
  | 'Command'
  | 'Recent Item';

export type ExecutiveCommandAction =
  | 'open'
  | 'review'
  | 'create'
  | 'capture'
  | 'analyze'
  | 'navigator'
  | 'voice'
  | 'tour'
  | 'disabled';

export type ExecutiveCommandResult = {
  id: string;
  name: string;
  type: ExecutiveCommandType;
  summary: string;
  owner: string;
  status: string;
  source: string;
  confidence: 'High' | 'Medium' | 'Low';
  destination?: string;
  action: ExecutiveCommandAction;
  keywords: string[];
};

export type ExecutiveCommandIndex = {
  generatedAt: string;
  results: ExecutiveCommandResult[];
  recentContext: {
    available: boolean;
    message: string;
  };
  sources: string[];
};

const OWNER_UNKNOWN = 'Owner not currently assigned.';
const RECENT_UNTRACKED = 'Recent history not currently tracked.';
const SOURCE_TIMEOUT_MS = 3500;

async function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), SOURCE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function normalizeKeywords(values: Array<string | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .flatMap((value) => (value || '').split(/[\s,;/|]+/))
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function commandAction(id: string, action?: string): ExecutiveCommandAction {
  if (action === 'capture:quick') return 'capture';
  if (action === 'capture:analyze') return 'analyze';
  if (action === 'navigator:open') return 'navigator';
  if (action === 'voice:open') return 'voice';
  if (action === 'tour:start') return 'tour';
  if (id.startsWith('create-') || id.includes('launch')) return 'create';
  if (id.startsWith('review-')) return 'review';
  return 'open';
}

function typeForKnowledge(category: string): ExecutiveCommandType {
  if (category === 'Blueprints') return 'Blueprint';
  if (category === 'Assessments') return 'Assessment';
  if (category === 'Training') return 'Training';
  if (category === 'Policies') return 'Policy';
  if (category === 'Templates' || category === 'SOPs' || category === 'Architecture') return 'Document';
  return 'Knowledge Asset';
}

function dedupe(items: ExecutiveCommandResult[]): ExecutiveCommandResult[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}|${item.name}|${item.destination || item.action}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortResults(items: ExecutiveCommandResult[]): ExecutiveCommandResult[] {
  const priority: Record<ExecutiveCommandType, number> = {
    Action: 1,
    Organization: 2,
    'Decision Intelligence': 3,
    'Executive Intelligence': 4,
    Operation: 5,
    Capability: 6,
    Product: 7,
    'Atlas Object': 8,
    'Knowledge Asset': 9,
    Blueprint: 10,
    Assessment: 11,
    Training: 12,
    Policy: 13,
    Document: 14,
    Experience: 15,
    Command: 16,
    'Recent Item': 99,
  };

  return [...items].sort((a, b) => {
    const rank = priority[a.type] - priority[b.type];
    if (rank !== 0) return rank;
    return a.name.localeCompare(b.name);
  });
}

function workspaceActions(): ExecutiveCommandResult[] {
  const certifiedActions: ExecutiveCommandResult[] = [
    {
      id: 'open-executive-briefing',
      name: 'Open Executive Briefing',
      type: 'Action',
      summary: 'Return to the executive attention engine.',
      owner: 'Executive Operating System',
      status: 'Available',
      source: 'Mission Control navigation',
      confidence: 'High',
      destination: '/admin/master',
      action: 'open',
      keywords: ['executive', 'briefing', 'mission', 'attention', 'home'],
    },
    {
      id: 'review-decisions',
      name: 'Review Decisions',
      type: 'Action',
      summary: 'Open the Decision Intelligence queue.',
      owner: 'Executive Operating System',
      status: 'Available',
      source: 'Decision Intelligence',
      confidence: 'High',
      destination: '/admin/decisions',
      action: 'review',
      keywords: ['decision', 'approve', 'review', 'triage'],
    },
    {
      id: 'review-intelligence',
      name: 'Review Intelligence',
      type: 'Action',
      summary: 'Open executive recommendations, risks, opportunities, and business signals.',
      owner: 'Executive Operating System',
      status: 'Available',
      source: 'Executive Intelligence',
      confidence: 'High',
      destination: '/admin/intelligence',
      action: 'review',
      keywords: ['intelligence', 'risk', 'opportunity', 'recommendation'],
    },
    {
      id: 'open-operations',
      name: 'Open Operations',
      type: 'Action',
      summary: 'Review launch readiness, platform health, domains, APIs, and integrations.',
      owner: 'Executive Operating System',
      status: 'Available',
      source: 'Operations Center',
      confidence: 'High',
      destination: '/admin/operations',
      action: 'open',
      keywords: ['operations', 'health', 'launch', 'domain', 'ssl', 'api'],
    },
    {
      id: 'create-proposal',
      name: 'Create Proposal',
      type: 'Action',
      summary: 'Open the existing proposal workflow.',
      owner: 'Business Development',
      status: 'Backed by existing workflow',
      source: 'Proposals workspace',
      confidence: 'High',
      destination: '/admin/proposals',
      action: 'create',
      keywords: ['create', 'proposal', 'sell', 'quote'],
    },
    {
      id: 'create-portal',
      name: 'Create Portal',
      type: 'Action',
      summary: 'Open the EACP launch workflow for a client portal package.',
      owner: 'EA Factory',
      status: 'Backed by existing launch workflow',
      source: 'EACP Launch Engine',
      confidence: 'Medium',
      destination: '/admin/ea-factory/launches',
      action: 'create',
      keywords: ['create', 'portal', 'client', 'experience', 'launch'],
    },
    {
      id: 'create-website',
      name: 'Create Website',
      type: 'Action',
      summary: 'Open the EACP launch workflow for a website package.',
      owner: 'EA Factory',
      status: 'Backed by existing launch workflow',
      source: 'EACP Launch Engine',
      confidence: 'Medium',
      destination: '/admin/ea-factory/launches',
      action: 'create',
      keywords: ['create', 'website', 'landing', 'launch'],
    },
    {
      id: 'create-blueprint',
      name: 'Create Blueprint',
      type: 'Action',
      summary: 'Open the existing blueprint workspace.',
      owner: 'Business Development',
      status: 'Backed by existing workflow',
      source: 'Blueprint Library',
      confidence: 'High',
      destination: '/admin/blueprints',
      action: 'create',
      keywords: ['create', 'blueprint', 'operational', 'magnifi'],
    },
  ];

  const existingCommands = ADMIN_COMMANDS.map((cmd): ExecutiveCommandResult => ({
    id: `command-${cmd.id}`,
    name: cmd.label,
    type: 'Command',
    summary: cmd.href ? `Open ${cmd.label}.` : `Run ${cmd.label}.`,
    owner: 'Executive Operating System',
    status: 'Available',
    source: 'Admin command registry',
    confidence: 'High',
    destination: cmd.href,
    action: commandAction(cmd.id, cmd.action),
    keywords: normalizeKeywords([cmd.label, cmd.group, ...(cmd.keywords || [])]),
  }));

  return [...certifiedActions, ...existingCommands];
}

export async function buildExecutiveCommandIndex(): Promise<ExecutiveCommandIndex> {
  const [
    organizations,
    products,
    operations,
    decisions,
    intelligence,
  ] = await Promise.all([
    withTimeout(getOrganization360Summaries(), []).catch(() => []),
    withTimeout(getProductOperationsSummaries(), []).catch(() => []),
    withTimeout(getOperationsVisibility(), null).catch(() => null),
    withTimeout(getDecisionIntelligence(), null).catch(() => null),
    withTimeout(getExecutiveIntelligence(), null).catch(() => null),
  ]);

  const results: ExecutiveCommandResult[] = [
    ...workspaceActions(),
    ...organizations.map((org): ExecutiveCommandResult => ({
      id: `org-${org.id}`,
      name: org.name,
      type: 'Organization',
      summary: `${org.healthStatus}. ${org.recommendedNextAction}`,
      owner: org.primaryOwner,
      status: org.status,
      source: org.provenance.identity.source,
      confidence: org.provenance.identity.confidence,
      destination: org.href,
      action: 'open',
      keywords: normalizeKeywords([org.name, org.clientName, org.email, org.type, org.status, org.healthStatus]),
    })),
    ...listExecutiveCapabilities().map((capability): ExecutiveCommandResult => ({
      id: `capability-${capability.slug}`,
      name: capability.name,
      type: 'Capability',
      summary: capability.businessProblem,
      owner: OWNER_UNKNOWN,
      status: capability.maturity,
      source: 'Capability Center',
      confidence: capability.futureState ? 'Medium' : 'High',
      destination: `/admin/capabilities/${capability.slug}`,
      action: 'open',
      keywords: normalizeKeywords([
        capability.name,
        capability.category,
        capability.maturity,
        capability.businessProblem,
        ...capability.outputs,
      ]),
    })),
    ...products.map((product): ExecutiveCommandResult => ({
      id: `product-${product.slug}`,
      name: product.trademark,
      type: 'Product',
      summary: product.executiveSummary,
      owner: product.ownerDisplay,
      status: product.status,
      source: product.provenance.identity.source,
      confidence: product.provenance.identity.confidence,
      destination: product.href,
      action: 'open',
      keywords: normalizeKeywords([product.name, product.trademark, product.status, product.health, product.purpose]),
    })),
    ...listKnowledgeAssets().map((asset): ExecutiveCommandResult => ({
      id: `knowledge-${asset.slug}`,
      name: asset.title,
      type: typeForKnowledge(asset.category),
      summary: asset.summary,
      owner: asset.owner,
      status: asset.status,
      source: asset.provenance.source,
      confidence: asset.provenance.confidence,
      destination: `/admin/knowledge/${asset.slug}`,
      action: 'open',
      keywords: normalizeKeywords([
        asset.title,
        asset.category,
        asset.status,
        ...asset.tags,
        ...asset.relatedCapabilities,
        ...asset.relatedOrganizations,
      ]),
    })),
    ...listAtlasObjects().map((object): ExecutiveCommandResult => ({
      id: `atlas-${object.id}`,
      name: object.title,
      type: 'Atlas Object',
      summary: object.executiveSummary,
      owner: object.owner,
      status: object.status,
      source: object.authoritativeSource.label,
      confidence: object.confidence,
      destination: `/admin/atlas/${object.id}`,
      action: 'open',
      keywords: normalizeKeywords([
        object.title,
        object.objectType,
        object.purpose,
        object.status,
        object.authoritativeSource.label,
      ]),
    })),
    ...EXPERIENCE_REGISTRY.filter((entry) => entry.status !== 'hidden').map((entry): ExecutiveCommandResult => ({
      id: `experience-${entry.capabilityId}`,
      name: entry.title,
      type: 'Experience',
      summary: entry.description,
      owner: entry.requiredRole,
      status: entry.status,
      source: 'Experience Registry',
      confidence: 'High',
      destination: entry.route.replace('/portal/[slug]', '/portal/login'),
      action: 'open',
      keywords: normalizeKeywords([
        entry.title,
        entry.primaryLabel,
        entry.secondaryBrand,
        entry.internalModule,
        entry.customerGoal,
        entry.status,
      ]),
    })),
  ];

  if (operations) {
    results.push(
      ...operations.platformHealth.map((item): ExecutiveCommandResult => ({
        id: `operation-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: item.label,
        type: 'Operation',
        summary: item.detail,
        owner: 'Operations',
        status: item.state,
        source: 'Operations Center',
        confidence: 'High',
        destination: '/admin/operations',
        action: 'open',
        keywords: normalizeKeywords([item.label, item.state, item.detail, 'operations', 'health']),
      })),
    );
  }

  if (decisions) {
    results.push(
      ...Object.entries(decisions.queue).flatMap(([horizon, items]) =>
        items.map((item): ExecutiveCommandResult => ({
          id: `decision-${item.id}`,
          name: item.title,
          type: 'Decision Intelligence',
          summary: item.reason,
          owner: 'Executive',
          status: horizon,
          source: item.source,
          confidence: item.confidence,
          destination: item.href || '/admin/decisions',
          action: 'review',
          keywords: normalizeKeywords([
            item.title,
            item.reason,
            item.recommendedAction,
            horizon,
            ...item.sourceSystems,
            ...item.relatedOrganizations,
            ...item.relatedCapabilities,
          ]),
        })),
      ),
    );
  }

  if (intelligence) {
    results.push(
      ...intelligence.recommendations.map((item): ExecutiveCommandResult => ({
        id: `intelligence-${item.id}`,
        name: item.title,
        type: 'Executive Intelligence',
        summary: item.reason,
        owner: 'Executive',
        status: item.horizon,
        source: item.provenance.source,
        confidence: item.confidence,
        destination: item.href || '/admin/intelligence',
        action: 'review',
        keywords: normalizeKeywords([
          item.title,
          item.reason,
          item.nextAction,
          item.horizon,
          ...item.provenance.supportingSystems,
        ]),
      })),
    );
  }

  results.push({
    id: 'recent-history-untracked',
    name: RECENT_UNTRACKED,
    type: 'Recent Item',
    summary: 'Recently viewed objects will appear after an authoritative history store exists.',
    owner: 'Executive Operating System',
    status: 'Unavailable',
    source: 'Recent context store',
    confidence: 'High',
    action: 'disabled',
    keywords: ['recent', 'history', 'viewed', 'favorites', 'context'],
  });

  return {
    generatedAt: new Date().toISOString(),
    results: sortResults(dedupe(results)),
    recentContext: {
      available: false,
      message: RECENT_UNTRACKED,
    },
    sources: [
      'Atlas',
      'Knowledge Center',
      'Capability Center',
      'Organization 360',
      'Operations Center',
      'Decision Intelligence',
      'Executive Intelligence',
      'Experience Registry',
      'Architecture documentation',
      'Mission Control',
    ],
  };
}
