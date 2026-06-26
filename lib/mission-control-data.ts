/**
 * Builds Mission Control response from ea-payments Pulse + Attention data.
 */

import { normalizeActivityEvent } from '@ea/portal-chassis/activity';
import { toAgentRun } from '@ea/portal-chassis/agents';
import {
  buildMissionControlResponse,
  DEFAULT_ACTION_CARDS,
  type MissionControlResponse,
} from '@ea/portal-chassis/mission-control';
import { fromActivityEvent, fromPulseEventRow, mergeEventStreams } from '@ea/portal-chassis/platform-events';
import type { PlatformEvent } from '@ea/portal-chassis/platform-events';
import { listAgents } from '@/lib/agents/registry';
import type { AttentionItem } from '@/lib/pulse-attention';
import type { PulseEvent } from '@/lib/pulse-bus';

const EA_ORG = 'ea';

const EA_ACTION_CARDS = DEFAULT_ACTION_CARDS.map((card) => {
  if (card.id === 'portal') return { ...card, href: '/admin/ea-factory/new-experience' };
  if (card.id === 'landing') return { ...card, href: '/admin/ea-factory/skin-factory' };
  if (card.id === 'training') return { ...card, href: '/admin/ea-factory/training-transformations' };
  if (card.id === 'launch') return { ...card, href: '/launch' };
  return card;
});

const CONTINUE_SEEDS = [
  {
    id: 'continue-factory',
    title: 'EA Factory',
    summary: 'Protocols, repos, skin briefs, and launch packages',
    href: '/admin/ea-factory',
    module: 'build',
  },
  {
    id: 'continue-skin',
    title: 'Skin Factory',
    summary: 'Continue a landing page or portal skin brief',
    href: '/admin/ea-factory/skin-factory',
    module: 'build',
  },
  {
    id: 'continue-simplifi',
    title: 'Simplifi Workspace',
    summary: 'Opportunities, decisions, and daily brief',
    href: '/simplifi/workspace',
    module: 'simplifi',
  },
];

export function buildEAMissionControl(input: {
  attentionItems: AttentionItem[];
  pulseEvents: (PulseEvent & { at?: string })[];
  userName?: string;
  role?: 'executive' | 'builder';
}): MissionControlResponse {
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

  const continueEvents = CONTINUE_SEEDS.map((seed) =>
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

  const events = mergeEventStreams([], [...attentionEvents, ...pulsePlatform, ...continueEvents]);

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
          actionUrl: '/api/agents/research',
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
      role: input.role ?? 'executive',
    },
    {
      actionCards: EA_ACTION_CARDS,
      agentRuns,
      quickActions: [
        { label: 'Resource Radar', href: '/admin/resource-radar', module: 'simplifi' },
        { label: 'EA Factory', href: '/admin/ea-factory', module: 'build' },
        { label: 'Launch Command', href: '/launch', module: 'pulse' },
      ],
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
