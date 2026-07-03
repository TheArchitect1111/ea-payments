/**
 * ActivityEvents read/write for ea-payments — bridges AIRTABLE_API_KEY to portal-chassis.
 */

import {
  ACTIVITY_EVENTS_TABLE,
  listActivityEvents,
  publishActivityEvent,
  type ActivityEvent,
  type ActivityEventInput,
} from '@ea/portal-chassis/activity';

const EA_ORG = 'ea';

function chassisAirtableReady(): boolean {
  if (!process.env.AIRTABLE_PAT?.trim()) {
    const key = process.env.AIRTABLE_API_KEY?.trim();
    if (key) process.env.AIRTABLE_PAT = key;
  }
  return Boolean(process.env.AIRTABLE_PAT?.trim() && process.env.AIRTABLE_PAYMENTS_BASE_ID?.trim());
}

function activityTableId(): string {
  return process.env.ACTIVITY_EVENTS_TABLE?.trim() || ACTIVITY_EVENTS_TABLE;
}

export async function listEAActivityEvents(maxRecords = 50): Promise<ActivityEvent[]> {
  if (!chassisAirtableReady()) return [];

  const baseId = process.env.AIRTABLE_PAYMENTS_BASE_ID!;
  try {
    return await listActivityEvents(baseId, activityTableId(), {
      organizationId: EA_ORG,
      maxRecords,
    });
  } catch (err) {
    console.error('[ea-activity-events] list failed:', err);
    return [];
  }
}

export async function publishEAActivityEvent(input: ActivityEventInput): Promise<void> {
  if (!chassisAirtableReady()) return;

  const baseId = process.env.AIRTABLE_PAYMENTS_BASE_ID!;
  try {
    await publishActivityEvent(baseId, activityTableId(), {
      ...input,
      organizationId: input.organizationId || EA_ORG,
    });
  } catch (err) {
    console.error('[ea-activity-events] publish failed:', err);
  }
}
