/**
 * Pulse™ ingestion bus — normalized activity events from all EA products.
 * Persists to Airtable when PULSE_EVENTS_TABLE is configured; dual-writes ActivityEvents.
 */

import { fromPulseEventRow, toActivityEventInput } from '@ea/portal-chassis/platform-events';
import { publishPlatformActivityEvent } from '@/lib/activity-events-store';

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
  | 'ctp.submitted'
  | 'ctp.intake.analyzed'
  | 'ctp.workspace.provisioning'
  | 'ctp.workspace.active'
  | 'ctp.workspace.failed'
  | 'ctp.studio.started'
  | 'ctp.studio.ready'
  | 'ctp.studio.input'
  | 'ctp.studio.complete'
  | 'ctp.production.ready'
  | 'ctp.bi.ready'
  | 'ctp.digital.audit'
  | 'ctp.website.live'
  | 'ctp.website.failed'
  | 'ctp.ready_for_review'
  | 'ctp.revealed'
  | 'ctp.review.scheduled'
  | 'ctp.executive_email.resent'
  | 'apply.submitted'
  | 'portal.login'
  | 'proposal.pending'
  | 'onboarding.blocked'
  | 'fulfillment.review_required'
  | 'fulfillment.provisioned'
  | 'launch.verification.completed'
  | 'payment.received'
  | 'subscription.started'
  | 'subscription.active'
  | 'subscription.trialing'
  | 'subscription.canceled'
  | 'subscription.unpaid'
  | 'subscription.past_due'
  | 'subscription.invoice.paid'
  | 'subscription.invoice.failed'
  | 'attention.critical'
  | 'guide.escalated';

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

const PRIORITY_SCORE: Record<string, number> = {
  critical: 95,
  high: 75,
  medium: 50,
  low: 30,
};

export function listRecentPulseEvents(limit = 50): (PulseEvent & { at: string })[] {
  return memoryEvents.slice(0, limit);
}

export async function emitPulseEvent(event: PulseEvent): Promise<{ ok: boolean }> {
  const row = { ...event, at: new Date().toISOString() };
  memoryEvents.unshift(row);
  if (memoryEvents.length > MEMORY_CAP) memoryEvents.length = MEMORY_CAP;

  void mirrorPulseToActivityEvents(event, row.at);

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

/** Dual-write Pulse events into ActivityEvents for Mission Control convergence. */
async function mirrorPulseToActivityEvents(event: PulseEvent, at: string): Promise<void> {
  try {
    const platform = fromPulseEventRow(
      {
        organizationId: process.env.EA_INTERNAL_ORG_ID ?? 'ea',
        clientSlug: event.tenantId,
        eventType: event.type,
        title: event.title,
        summary: event.detail ?? '',
        priority: PRIORITY_SCORE[event.priority ?? 'medium'] ?? 50,
        module: mapProductToModule(event.product),
        actionLabel: 'Open',
        actionUrl: event.href,
        personId: event.tenantId,
        createdAt: at,
        metadata: {
          ...(event.metadata ?? {}),
          objectId: event.objectId,
          pulseProduct: event.product,
        },
      },
      `pulse-${at}`,
    );

    await publishPlatformActivityEvent(toActivityEventInput(platform));
  } catch (err) {
    console.error('[pulse-bus] ActivityEvents mirror failed:', err);
  }
}
