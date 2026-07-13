/**
 * Builds Mission Control response from ea-payments Pulse + Attention data.
 */

import { normalizeActivityEvent } from '@ea/portal-chassis/activity';
import type { ActivityEvent } from '@ea/portal-chassis/activity';
import { toAgentRun } from '@ea/portal-chassis/agents';
import {
  buildMissionControlFromStreams,
  buildMissionControlResponse,
  DEFAULT_ACTION_CARDS,
  type MissionControlResponse,
} from '@ea/portal-chassis/mission-control';
import { fromActivityEvent, fromPulseEventRow, mergeEventStreams } from '@ea/portal-chassis/platform-events';
import type { PlatformEvent } from '@ea/portal-chassis/platform-events';
import { listAgents } from '@/lib/agents/registry';
import { listPlatformActivityEvents } from '@/lib/activity-events-store';
import type { AttentionItem } from '@/lib/pulse-attention';
import { listRecentPulseEvents, type PulseEvent } from '@/lib/pulse-bus';
import { getPackageSyncHealth } from '@/lib/platform/package-sync-health';

const EA_ORG = 'ea';

const EA_ACTION_CARDS = DEFAULT_ACTION_CARDS.map((card) => {
  if (card.id === 'portal') return { ...card, href: '/admin/ea-factory/new-experience' };
  if (card.id === 'landing') return { ...card, href: '/admin/ea-factory/skin-factory' };
  if (card.id === 'training') return { ...card, href: '/admin/ea-factory/training-transformations' };
  if (card.id === 'launch') return { ...card, href: '/launch' };
  return card;
});

const CONTINUE_SEEDS: Array<{
  id: string;
  title: string;
  summary: string;
  href: string;
  module: string;
  modes: Array<'executive' | 'builder'>;
}> = [
  {
    id: 'continue-client-factory',
    title: 'New Client Factory',
    summary: 'Reproduce a portal from a ClientConfig preset (org + entitlements + workspace)',
    href: '/admin/ea-factory/client-factory',
    module: 'build',
    modes: ['builder'],
  },
  {
    id: 'continue-reproduce-preview',
    title: 'Reproduce Preview',
    summary: 'Portal + landing assembled from the same ClientConfig',
    href: '/admin/reproduce-preview',
    module: 'build',
    modes: ['builder'],
  },
  {
    id: 'continue-public-site',
    title: 'Public site (EA)',
    summary: 'Live landing rendered from ClientConfig via landing-chassis',
    href: '/site/ea',
    module: 'build',
    modes: ['builder', 'executive'],
  },
  {
    id: 'continue-cpr-site',
    title: 'CPR Athletics site',
    summary: 'Vertical content pack proof — recruiting landing from CPR ClientConfig',
    href: '/site/cpr',
    module: 'build',
    modes: ['builder', 'executive'],
  },
  {
    id: 'continue-etfm-site',
    title: 'ETFM Coaching site',
    summary: 'Financial coaching pack — portal + landing from ETFM ClientConfig',
    href: '/site/etfm',
    module: 'build',
    modes: ['builder'],
  },
  {
    id: 'continue-3hc-site',
    title: '3HC Readiness site',
    summary: 'Compliance readiness pack from 3HC ClientConfig',
    href: '/site/3hc',
    module: 'build',
    modes: ['builder'],
  },
  {
    id: 'continue-bob-rumball-site',
    title: 'Bob Rumball Learning site',
    summary: 'Accessible learning pack from Bob Rumball ClientConfig',
    href: '/site/bob-rumball',
    module: 'build',
    modes: ['builder'],
  },
  {
    id: 'continue-domains',
    title: 'Client domain map',
    summary: 'Custom host → site/portal slug bindings (seed + EA_CLIENT_DOMAIN_MAP)',
    href: '/api/platform/domains',
    module: 'build',
    modes: ['builder'],
  },
  {
    id: 'continue-workspace-preview',
    title: 'Workspace Preview',
    summary: 'Live shell with theme, personality, and capability nav',
    href: '/admin/workspace-preview',
    module: 'build',
    modes: ['builder'],
  },
  {
    id: 'continue-platform-foundation',
    title: 'Platform Foundation',
    summary: 'Capability, payments, CPR readiness, and vendor package sync',
    href: '/admin/capability-marketplace?tab=foundation',
    module: 'build',
    modes: ['builder'],
  },
  {
    id: 'continue-package-sync',
    title: 'Sync platform packages',
    summary: 'Refresh vendor/@ea copies from ea-operating-system when drift appears',
    href: '/admin/capability-marketplace?tab=foundation',
    module: 'build',
    modes: ['builder'],
  },
  {
    id: 'continue-capabilities',
    title: 'Capability Marketplace',
    summary: 'Browse platform capabilities, clients, and assembly health',
    href: '/admin/capability-marketplace',
    module: 'build',
    modes: ['builder'],
  },
  {
    id: 'continue-factory',
    title: 'EA Factory',
    summary: 'Protocols, repos, skin briefs, and launch packages',
    href: '/admin/ea-factory',
    module: 'build',
    modes: ['builder'],
  },
  {
    id: 'continue-skin',
    title: 'Skin Factory',
    summary: 'Continue a landing page or portal skin brief',
    href: '/admin/ea-factory/skin-factory',
    module: 'build',
    modes: ['builder'],
  },
  {
    id: 'continue-simplifi',
    title: 'Simplifi Workspace',
    summary: 'Opportunities, decisions, and daily brief',
    href: '/simplifi/workspace',
    module: 'simplifi',
    modes: ['executive', 'builder'],
  },
  {
    id: 'continue-delivery',
    title: 'Client Delivery',
    summary: 'Active clients, onboarding, and delivery board',
    href: '/admin/delivery',
    module: 'clients',
    modes: ['executive'],
  },
];

const QUICK_ACTIONS_EXECUTIVE = [
  { label: 'Resource Radar', href: '/admin/resource-radar', module: 'simplifi' },
  { label: 'Client Delivery', href: '/admin/delivery', module: 'clients' },
  { label: 'Launch Command', href: '/launch', module: 'pulse' },
];

const QUICK_ACTIONS_BUILDER = [
  { label: 'EA Factory', href: '/admin/ea-factory', module: 'build' },
  { label: 'New Client', href: '/admin/ea-factory/client-factory', module: 'build' },
  { label: 'Reproduce', href: '/admin/reproduce-preview', module: 'build' },
  { label: 'Skin Factory', href: '/admin/ea-factory/skin-factory', module: 'build' },
  { label: 'Chassis Deploy', href: '/admin/ea-factory/chassis-deployment', module: 'build' },
];

export function parseMissionControlRole(value: string | null | undefined): 'executive' | 'builder' {
  return value === 'builder' ? 'builder' : 'executive';
}

export function buildEAMissionControl(input: {
  attentionItems: AttentionItem[];
  pulseEvents: (PulseEvent & { at?: string })[];
  activityEvents?: ActivityEvent[];
  userName?: string;
  role?: 'executive' | 'builder';
}): MissionControlResponse {
  const role = input.role ?? 'executive';
  const attentionEvents = input.attentionItems.map(attentionToPlatform);
  const pulsePlatform = input.pulseEvents.map((e) =>
    fromPulseEventRow(
      {
        organizationId: EA_ORG,
        eventType: e.type,
        title: e.title,
        summary: e.detail,
        module: e.product,
        priority: pulsePriorityToScore(e.priority),
        actionUrl: e.href,
        personId: e.tenantId,
        createdAt: e.at,
        metadata: e.metadata as Record<string, unknown> | undefined,
      },
      `pulse-${e.type}-${e.at ?? e.title}`,
    ),
  );

  const continueSeeds = CONTINUE_SEEDS.filter((seed) =>
    seed.modes.includes(role),
  );

  const continueEvents = continueSeeds.map((seed) =>
    fromActivityEvent(
      normalizeActivityEvent({
        organizationId: EA_ORG,
        module: seed.module,
        eventType: 'work_in_progress',
        title: seed.title,
        summary: seed.summary,
        priority: 55,
        actionLabel: 'Continue',
        actionUrl: seed.href,
        metadata: {
          continueUrl: seed.href,
          continueTitle: seed.title,
          category: 'continue',
        },
      }, seed.id),
    ),
  );

  const packageSync = getPackageSyncHealth();
  const packageSyncEvents: PlatformEvent[] = [];
  if (!packageSync.ok) {
    packageSyncEvents.push(
      fromActivityEvent(
        normalizeActivityEvent(
          {
            organizationId: EA_ORG,
            module: 'build',
            eventType: 'attention.item',
            title: 'Platform package sync needed',
            summary: packageSync.syncHint,
            priority: packageSync.missing.length ? 85 : 70,
            actionLabel: 'Open foundation',
            actionUrl: '/admin/capability-marketplace?tab=foundation',
            metadata: {
              whyRecommended: packageSync.drifted.length
                ? `Drifted: ${packageSync.drifted.join(', ')}`
                : `Missing: ${packageSync.missing.join(', ')}`,
              source: 'package-sync-health',
              category: 'platform',
            },
          },
          'attention-package-sync',
        ),
      ),
    );
  }

  const events = mergeEventStreams(input.activityEvents ?? [], [
    ...attentionEvents,
    ...packageSyncEvents,
    ...pulsePlatform,
    ...continueEvents,
  ]);

  const agentRuns = listAgents().map((agent, index) => {
    const kind = agent.name.toLowerCase().replace(/\s+agent$/, '').replace(/\s+/g, '-');
    return toAgentRun(
      normalizeActivityEvent(
        {
          organizationId: EA_ORG,
          module: 'agent',
          eventType: 'agent.available',
          title: agent.name,
          summary: agent.description,
          priority: 45,
          metric: agent.status(),
          actionLabel: 'Invoke',
          actionUrl: agent.name === 'platform-guardian' ? '/api/health/ops' : '/api/agents/research',
          metadata: {
            agentKind: kind,
            agentStatus: 'queued',
            task: agent.capabilities[0] ?? 'Ready on request',
            progress: 0,
            reviewRequired: false,
          },
        },
        `agent-registry-${index}`,
      ),
    );
  });

  return buildMissionControlResponse(
    events,
    {
      organizationId: EA_ORG,
      userName: input.userName,
      role,
    },
    {
      actionCards: EA_ACTION_CARDS,
      agentRuns,
      quickActions: role === 'builder' ? QUICK_ACTIONS_BUILDER : QUICK_ACTIONS_EXECUTIVE,
    },
  );
}

function attentionToPlatform(item: AttentionItem): PlatformEvent {
  const priorityMap: Record<AttentionItem['priority'], number> = {
    critical: 95,
    high: 80,
    medium: 55,
    low: 30,
  };

  return fromActivityEvent(
    normalizeActivityEvent(
      {
        organizationId: EA_ORG,
        module: slugifyProduct(item.product),
        eventType: 'attention.item',
        title: item.title,
        summary: item.detail,
        priority: priorityMap[item.priority],
        actionLabel: item.cta,
        actionUrl: item.href,
        metadata: {
          whyRecommended: `Prioritized because this is ${item.priority} priority for ${item.product}.`,
          source: 'pulse-attention',
        },
      },
      item.id,
    ),
  );
}

function pulsePriorityToScore(priority?: PulseEvent['priority']): number {
  switch (priority) {
    case 'critical':
      return 95;
    case 'high':
      return 80;
    case 'medium':
      return 55;
    case 'low':
      return 30;
    default:
      return 50;
  }
}

function slugifyProduct(product: string): string {
  return product.toLowerCase().replace(/\s+/g, '-');
}

const PRIORITY_SCORE: Record<string, number> = {
  critical: 95,
  high: 75,
  medium: 50,
  low: 30,
};

export function internalOrgId(): string {
  return process.env.EA_INTERNAL_ORG_ID ?? 'ea';
}

function pulseEventToPlatform(event: PulseEvent & { at: string }, index: number): PlatformEvent {
  return fromPulseEventRow(
    {
      id: `pulse-${index}-${event.at}`,
      organizationId: internalOrgId(),
      clientSlug: event.tenantId,
      eventType: event.type,
      title: event.title,
      summary: event.detail ?? '',
      priority: PRIORITY_SCORE[event.priority ?? 'medium'] ?? 50,
      module: event.product,
      actionLabel: 'Open',
      actionUrl: event.href,
      personId: event.tenantId,
      createdAt: event.at,
      metadata: {
        ...(event.metadata ?? {}),
        objectId: event.objectId,
        pulseProduct: event.product,
      },
    },
    `pulse-${index}-${event.at}`,
  );
}

export async function buildMissionControlPayload(input?: {
  role?: 'executive' | 'builder';
  userName?: string;
}): Promise<MissionControlResponse> {
  const organizationId = internalOrgId();
  const role = input?.role ?? 'executive';
  const userName = input?.userName ?? 'there';

  const [activity, pulseRows] = await Promise.all([
    listPlatformActivityEvents(organizationId, 100),
    Promise.resolve(
      listRecentPulseEvents(80).map((event, index) => pulseEventToPlatform(event, index)),
    ),
  ]);

  return buildMissionControlFromStreams(activity, pulseRows, {
    organizationId,
    userName,
    role,
  });
}
