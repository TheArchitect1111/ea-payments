/**
 * ActivityEvents store — Airtable when configured, in-memory fallback for dev.
 */

import {
  listActivityEvents,
  publishActivityEvent,
  type ActivityEvent,
  type ActivityEventInput,
} from '@ea/portal-chassis/activity';

const MEMORY_CAP = 300;
const memoryEvents: ActivityEvent[] = [];

export const ACTIVITY_EVENTS_TABLE =
  process.env.AIRTABLE_ACTIVITY_EVENTS_TABLE ?? 'ActivityEvents';

function baseId(): string | undefined {
  return process.env.AIRTABLE_PAYMENTS_BASE_ID;
}

function airtableConfigured(): boolean {
  return Boolean(baseId() && (process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT));
}

export async function listPlatformActivityEvents(
  organizationId: string,
  limit = 100,
): Promise<ActivityEvent[]> {
  if (airtableConfigured()) {
    try {
      return await listActivityEvents(baseId()!, ACTIVITY_EVENTS_TABLE, {
        organizationId,
        maxRecords: limit,
      });
    } catch (err) {
      console.error('[activity-events] Airtable list failed:', err);
    }
  }

  return memoryEvents
    .filter((event) => event.organizationId === organizationId)
    .slice(0, limit);
}

export async function publishPlatformActivityEvent(
  input: ActivityEventInput,
): Promise<ActivityEvent | null> {
  if (airtableConfigured()) {
    try {
      const event = await publishActivityEvent(baseId()!, ACTIVITY_EVENTS_TABLE, input);
      memoryEvents.unshift(event);
      if (memoryEvents.length > MEMORY_CAP) memoryEvents.length = MEMORY_CAP;
      return event;
    } catch (err) {
      console.error('[activity-events] Airtable publish failed:', err);
    }
  }

  const event: ActivityEvent = {
    id: `mem_${Date.now()}`,
    organizationId: input.organizationId,
    module: input.module,
    eventType: input.eventType,
    title: input.title,
    summary: input.summary,
    priority: input.priority ?? 50,
    metric: input.metric,
    actionLabel: input.actionLabel,
    actionUrl: input.actionUrl,
    personId: input.personId,
    createdAt: input.createdAt ?? new Date().toISOString(),
    metadata: input.metadata ?? {},
  };

  memoryEvents.unshift(event);
  if (memoryEvents.length > MEMORY_CAP) memoryEvents.length = MEMORY_CAP;
  return event;
}
