/**
 * Pulse™ ingestion bus — normalized activity events from all EA products.
 * Persists to Airtable when PULSE_EVENTS_TABLE is configured; dual-writes ActivityEvents.
 */

import { fromPulseEventRow, toActivityEventInput } from '@ea/portal-chassis/platform-events';
import { publishEAActivityEvent } from '@/lib/ea-activity-events';

export type PulseProduct =
  | 'ea-platform'
  | 'simplifi'
  | 'magnifi'
  | 'amplifi'
  | 'pulse'
  | 'update-hub'
  | 'cpr'
  | 'brotherhub'
  | 'sisterhub';

export type PulseEventType =
  | 'capture.completed'
  | 'capture.queued'
  | 'capture.active_saved'
  | 'capture.outcome_recorded'
  | 'update.submitted'
  | 'update.published'
  | 'assessment.submitted'
  | 'apply.submitted'
  | 'portal.login'
  | 'proposal.pending'
  | 'onboarding.blocked'
  | 'fulfillment.review_required'
  | 'launch.verification.completed'
  | 'payment.received'
  | 'attention.critical';

export interface PulseEvent {
  product: PulseProduct;
  type: PulseEventType;
  title: string;
  detail?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  href?: string;
  tenantId?: string;
  objectId?: string;
  metadata?: Record<string, string | number | boolean>;
}

const MEMORY_CAP = 200;
const memoryEvents: (PulseEvent & { at: string })[] = [];

export function listRecentPulseEvents(limit = 50): (PulseEvent & { at: string })[] {
  return memoryEvents.slice(0, limit);
}

export async function emitPulseEvent(event: PulseEvent): Promise<{ ok: boolean }> {
  const row = { ...event, at: new Date().toISOString() };
  memoryEvents.unshift(row);
  if (memoryEvents.length > MEMORY_CAP) memoryEvents.length = MEMORY_CAP;

  const baseId = process.env.AIRTABLE_PAYMENTS_BASE_ID;
  const table = process.env.PULSE_EVENTS_TABLE;
  const key = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT;

  if (!baseId || !table || !key) {
    return { ok: true };
  }

  try {
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Product: event.product,
              'Event Type': event.type,
              Title: event.title,
              Detail: event.detail ?? '',
              Priority: event.priority ?? 'medium',
              URL: event.href ?? '',
              'Tenant ID': event.tenantId ?? '',
              'Object ID': event.objectId ?? '',
              'Recorded At': row.at,
            },
          },
        ],
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error('[pulse-bus] Airtable persist failed:', res.status, detail.slice(0, 200));
    }
  } catch (err) {
    console.error('[pulse-bus] Airtable persist threw:', err);
  }

  void dualWriteActivityEvent(event, row.at);

  return { ok: true };
}

function mapProductToModule(product: PulseProduct): string {
  const modules: Record<PulseProduct, string> = {
    'ea-platform': 'pulse',
    simplifi: 'simplifi',
    magnifi: 'connect',
    amplifi: 'update-hub',
    pulse: 'pulse',
    'update-hub': 'update-hub',
    cpr: 'portal',
    brotherhub: 'portal',
    sisterhub: 'portal',
  };
  return modules[product] ?? 'pulse';
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

async function dualWriteActivityEvent(event: PulseEvent, at: string): Promise<void> {
  const platform = fromPulseEventRow(
    {
      organizationId: 'ea',
      eventType: event.type,
      title: event.title,
      summary: event.detail,
      module: mapProductToModule(event.product),
      priority: pulsePriorityToScore(event.priority),
      actionUrl: event.href,
      personId: event.tenantId,
      createdAt: at,
      metadata: {
        ...(event.metadata as Record<string, unknown> | undefined),
        pulseProduct: event.product,
        objectId: event.objectId,
      },
    },
    `pulse-${event.type}-${at}`,
  );

  await publishEAActivityEvent(toActivityEventInput(platform));
}
