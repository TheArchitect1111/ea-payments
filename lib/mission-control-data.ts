/**
 * Mission Control data adapter — merges ActivityEvents + Pulse bus for admin home.
 */

import { buildMissionControlFromStreams } from '@ea/portal-chassis/mission-control';
import type { MissionControlResponse } from '@ea/portal-chassis/mission-control';
import { fromPulseEventRow } from '@ea/portal-chassis/platform-events';
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
import { listCanonicalPulseEvents } from '@/lib/pulse-event-store';
import { type PulseEvent } from '@/lib/pulse-bus';

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

  const [activity, pulseEvents, proposals, clients] = await Promise.all([
    listPlatformActivityEvents(organizationId, 100),
    listCanonicalPulseEvents(120),
    getProposalsWithAssessments(),
    getAllClientRecords(),
  ]);

  const pulseRows = pulseEvents.map((event, index) => pulseEventToPlatform(event, index));
  const customerSignals = customerOperatingEvents(buildCustomerOperatingSystem(clients));
  const rhythmSignals = operatingRhythmEvents(
    buildExecutiveOperatingRhythm({ clients, proposals, pulse: pulseEvents }),
  );

  return buildMissionControlFromStreams(activity, [...rhythmSignals, ...customerSignals, ...pulseRows], {
    organizationId,
    userName,
    role,
  });
}
