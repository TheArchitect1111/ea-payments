/**
 * Mission Control data adapter — merges ActivityEvents + Pulse bus for admin home.
 */

import { normalizeActivityEvent } from '@ea/portal-chassis/activity';
import { buildMissionControlFromStreams } from '@ea/portal-chassis/mission-control';
import type { MissionControlResponse } from '@ea/portal-chassis/mission-control';
import { fromActivityEvent, fromPulseEventRow } from '@ea/portal-chassis/platform-events';
import type { PlatformEvent } from '@ea/portal-chassis/platform-events';
import { getAllClientRecords, getProposalsWithAssessments } from '@/lib/airtable';
import { listPlatformActivityEvents } from '@/lib/activity-events-store';
import {
  buildCustomerOperatingSystem,
  customerOperatingEvents,
} from '@/lib/customer-operating-system';
import {
  buildExecutiveOperatingRhythm,
  operatingRhythmEvents,
} from '@/lib/executive-operating-rhythm';
import { getCtpAttentionStats } from '@/lib/ctp-attention-stats';
import { getPackageSyncHealth } from '@/lib/platform/package-sync-health';
import { buildAttentionItems, type AttentionItem } from '@/lib/pulse-attention';
import { buildWorkforceAttentionItems } from '@/lib/praison-ai/mission-control';
import { buildCreativeAttentionItems } from '@/lib/open-design/creative-status';
import { buildSimplifiPass1AttentionItems } from '@/lib/simplifi-pass1-ops';
import { listCanonicalPulseEvents } from '@/lib/pulse-event-store';
import { type PulseEvent, listRecentPulseEvents } from '@/lib/pulse-bus';

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

const ATTENTION_PRIORITY: Record<AttentionItem['priority'], number> = {
  critical: 95,
  high: 80,
  medium: 55,
  low: 30,
};

function attentionItemToPlatform(item: AttentionItem, organizationId: string): PlatformEvent {
  return fromActivityEvent(
    normalizeActivityEvent(
      {
        organizationId,
        module: item.id.startsWith('ctp-') ? 'ctp' : 'build',
        eventType: 'attention.item',
        title: item.title,
        summary: item.detail,
        priority: ATTENTION_PRIORITY[item.priority],
        actionLabel: item.cta ?? 'Open',
        actionUrl: item.href,
        metadata: {
          whyRecommended: `Prioritized because this is ${item.priority} priority for ${item.product}.`,
          source: 'pulse-attention',
          attentionId: item.id,
        },
      },
      item.id,
    ),
  );
}

function praisonAttentionEvents(organizationId: string): PlatformEvent[] {
  const recent = listRecentPulseEvents(80);
  const packages = recent
    .filter((e) => e.type === 'praison.package.ready' || e.type === 'praison.qa.failed')
    .slice(0, 10)
    .map((e) => ({
      id: String(e.objectId ?? e.at),
      submissionId: String(e.objectId ?? ''),
      businessName: e.title.replace(/^Executive intelligence ready — |^QA blocked — /, ''),
      reviewStatus:
        e.type === 'praison.qa.failed'
          ? ('qa-failed' as const)
          : ('awaiting-executive-review' as const),
      qa:
        e.type === 'praison.qa.failed'
          ? { passed: false, blockers: [e.detail ?? ''] }
          : { passed: true },
      pulseInsights: e.detail ? [e.detail] : [],
    }));

  return buildWorkforceAttentionItems(
    packages.map((p) => ({
      ...p,
      qa: p.qa?.passed === false
        ? {
            agentId: 'qa' as const,
            passed: false,
            checks: [],
            blockers: p.qa.blockers ?? [],
            confidence: 0,
            reviewedAt: new Date().toISOString(),
          }
        : undefined,
    })),
  ).map((item) => attentionItemToPlatform(item, organizationId));
}

function openDesignAttentionEvents(organizationId: string): PlatformEvent[] {
  const recent = listRecentPulseEvents(80);
  const briefs = recent
    .filter(
      (e) => e.type === 'open.design.story.blocked' || e.type === 'open.design.review.awaiting',
    )
    .slice(0, 12)
    .map((e) => {
      const organizationName = e.title
        .replace(/^Story gate blocked — |^Creative review ready — /, '')
        .trim();
      const blocked = e.type === 'open.design.story.blocked';
      return {
        id: String(e.objectId ?? e.at),
        organizationName: organizationName || 'Organization',
        reviewStatus: blocked
          ? ('story-extracted' as const)
          : ('awaiting-executive-review' as const),
        blockers: blocked ? [e.detail ?? 'Story sentence required.'] : [],
      };
    });

  return buildCreativeAttentionItems(briefs).map((item) =>
    attentionItemToPlatform(item, organizationId),
  );
}

async function ctpAttentionEvents(organizationId: string): Promise<PlatformEvent[]> {
  const ctpStats = await getCtpAttentionStats();
  const items = buildAttentionItems({
    captures: [],
    contentRequests: [],
    proposalsPendingReview: 0,
    onboardingWebhooksMissing: false,
    captureApiKeyMissing: false,
    cprAthleteCount: 0,
    cprActiveCount: 0,
    brotherHubMembers: 0,
    sisterHubMembers: 0,
    ctpWorkspacesPending: ctpStats.workspacesPending,
    ctpStudiosInProgress: ctpStats.studiosInProgress,
    ctpStudiosReadyForReview: ctpStats.studiosReadyForReview,
    ctpReviewsScheduled: ctpStats.reviewsScheduled,
    ctpExecutiveEmailsPending: ctpStats.executiveEmailsPending,
  }).filter((item) => item.id.startsWith('ctp-'));

  return items.map((item) => attentionItemToPlatform(item, organizationId));
}

function packageSyncAttentionEvents(organizationId: string): PlatformEvent[] {
  const packageSync = getPackageSyncHealth();
  if (packageSync.ok) return [];

  return [
    fromActivityEvent(
      normalizeActivityEvent(
        {
          organizationId,
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
  ];
}

async function launchOpsAttentionEvents(organizationId: string): Promise<PlatformEvent[]> {
  const items = await buildSimplifiPass1AttentionItems();
  return items.map((item) => attentionItemToPlatform(item, organizationId));
}

export async function buildMissionControlPayload(input?: {
  role?: 'executive' | 'builder';
  userName?: string;
}): Promise<MissionControlResponse> {
  const organizationId = internalOrgId();
  const role = input?.role ?? 'executive';
  const userName = input?.userName ?? 'there';

  const [activity, pulseEvents, proposals, clients, ctpSignals, launchOpsSignals] = await Promise.all([
    listPlatformActivityEvents(organizationId, 100),
    listCanonicalPulseEvents(120),
    getProposalsWithAssessments(),
    getAllClientRecords(),
    ctpAttentionEvents(organizationId),
    launchOpsAttentionEvents(organizationId),
  ]);

  const pulseRows = pulseEvents.map((event, index) => pulseEventToPlatform(event, index));
  const customerSignals = customerOperatingEvents(buildCustomerOperatingSystem(clients));
  const rhythmSignals = operatingRhythmEvents(
    buildExecutiveOperatingRhythm({ clients, proposals, pulse: pulseEvents }),
  );

  const packageSyncSignals = packageSyncAttentionEvents(organizationId);
  const praisonSignals = praisonAttentionEvents(organizationId);
  const openDesignSignals = openDesignAttentionEvents(organizationId);

  return buildMissionControlFromStreams(
    activity,
    [
      ...launchOpsSignals,
      ...packageSyncSignals,
      ...praisonSignals,
      ...openDesignSignals,
      ...ctpSignals,
      ...rhythmSignals,
      ...customerSignals,
      ...pulseRows,
    ],
    {
      organizationId,
      userName,
      role,
    },
  );
}
