/**
 * Canonical Pulse event store — single write/read path for cross-product activity.
 */

import { fromPulseEventRow, toActivityEventInput } from '@ea/portal-chassis/platform-events';

import { publishPlatformActivityEvent, listPlatformActivityEvents } from '@/lib/activity-events-store';
import { logPlatformEvent } from '@/lib/observability';
import { recordPlatformAuditEvent } from '@/lib/platform-audit';
import {
  EA_INTERNAL_ORG_ID,
  platformCreate,
  platformStoreConfigured,
} from '@/lib/platform-store';

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
  | 'ctp.studio.complete'
  | 'ctp.review.scheduled'
  | 'apply.submitted'
  | 'portal.login'
  | 'portal.provisioned'
  | 'proposal.pending'
  | 'proposal.approved'
  | 'proposal.rejected'
  | 'proposal.discovery_requested'
  | 'proposal.completed'
  | 'proposal.reveal_sent'
  | 'onboarding.started'
  | 'onboarding.blocked'
  | 'fulfillment.review_required'
  | 'launch.verification.completed'
  | 'payment.received'
  | 'payment.confirmation_sent'
  | 'payment.failed'
  | 'payment.recovery_sent'
  | 'subscription.started'
  | 'subscription.active'
  | 'subscription.trialing'
  | 'subscription.canceled'
  | 'subscription.unpaid'
  | 'subscription.past_due'
  | 'subscription.invoice.paid'
  | 'subscription.invoice.failed'
  | 'learning.reminder'
  | 'learning.completed'
  | 'customer.renewal_due'
  | 'customer.referral_requested'
  | 'customer.health.changed'
  | 'expansion.opportunity'
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

export type StoredPulseEvent = PulseEvent & { at: string };

const MEMORY_CAP = 200;
const memoryEvents: StoredPulseEvent[] = [];

const PULSE_EVENTS_TABLE = process.env.PULSE_EVENTS_TABLE?.trim() || 'Pulse Events';

const PRIORITY_SCORE: Record<string, number> = {
  critical: 95,
  high: 75,
  medium: 50,
  low: 30,
};

export function listMemoryPulseEvents(limit = 50): StoredPulseEvent[] {
  return memoryEvents.slice(0, limit);
}

function dedupeKey(event: StoredPulseEvent): string {
  return `${event.at}|${event.product}|${event.type}|${event.title}`;
}

function activityToStoredPulse(event: {
  module: string;
  eventType: string;
  title: string;
  summary?: string;
  actionUrl?: string;
  personId?: string;
  createdAt: string;
  priority?: number;
  metadata?: Record<string, unknown>;
}): StoredPulseEvent | null {
  const pulseProduct = event.metadata?.pulseProduct;
  if (typeof pulseProduct !== 'string' || !pulseProduct) return null;

  const objectId = event.metadata?.objectId;
  return {
    product: pulseProduct as PulseProduct,
    type: event.eventType as StoredPulseEvent['type'],
    title: event.title,
    detail: event.summary,
    priority: scoreToPriority(event.priority),
    href: event.actionUrl,
    tenantId: event.personId,
    objectId: typeof objectId === 'string' ? objectId : undefined,
    metadata: metadataWithoutPulseKeys(event.metadata),
    at: event.createdAt,
  };
}

function scoreToPriority(score?: number): StoredPulseEvent['priority'] {
  if (score === undefined) return 'medium';
  if (score >= 90) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function metadataWithoutPulseKeys(
  metadata?: Record<string, unknown>,
): Record<string, string | number | boolean> | undefined {
  if (!metadata) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (key === 'pulseProduct' || key === 'objectId') continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export async function listCanonicalPulseEvents(limit = 50): Promise<StoredPulseEvent[]> {
  const organizationId = EA_INTERNAL_ORG_ID;
  const merged = new Map<string, StoredPulseEvent>();

  for (const event of listMemoryPulseEvents(MEMORY_CAP)) {
    merged.set(dedupeKey(event), event);
  }

  try {
    const activity = await listPlatformActivityEvents(organizationId, limit * 2);
    for (const row of activity) {
      const pulse = activityToStoredPulse(row);
      if (!pulse) continue;
      merged.set(dedupeKey(pulse), pulse);
    }
  } catch (err) {
    logPlatformEvent({
      domain: 'pulse',
      level: 'warn',
      action: 'pulse.list_failed',
      message: 'Canonical pulse read fell back to memory ring',
      organizationId,
      metadata: { error: String(err) },
    });
  }

  return [...merged.values()]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}

export async function writeCanonicalPulseEvent(
  event: PulseEvent,
  correlationId?: string,
): Promise<{ ok: boolean }> {
  const row: StoredPulseEvent = { ...event, at: new Date().toISOString() };
  memoryEvents.unshift(row);
  if (memoryEvents.length > MEMORY_CAP) memoryEvents.length = MEMORY_CAP;

  logPlatformEvent({
    domain: 'pulse',
    level: 'info',
    action: 'pulse.ingested',
    message: event.title,
    organizationId: EA_INTERNAL_ORG_ID,
    tenantId: event.tenantId,
    correlationId,
    metadata: {
      product: event.product,
      type: event.type,
      priority: event.priority,
    },
  });

  void recordPlatformAuditEvent({
    organizationId: EA_INTERNAL_ORG_ID,
    action: 'pulse.ingested',
    targetType: 'pulse_event',
    targetId: `${event.product}:${event.type}`,
    summary: event.title,
    tenantId: event.tenantId,
    correlationId,
    metadata: {
      product: event.product,
      type: event.type,
      priority: event.priority,
    },
  });

  void mirrorPulseToActivityEvents(event, row.at);
  void persistPulseEventTable(row, correlationId);

  return { ok: true };
}

async function mirrorPulseToActivityEvents(event: PulseEvent, at: string): Promise<void> {
  try {
    const platform = fromPulseEventRow(
      {
        organizationId: EA_INTERNAL_ORG_ID,
        clientSlug: event.tenantId,
        eventType: event.type,
        title: event.title,
        summary: event.detail ?? '',
        priority: PRIORITY_SCORE[event.priority ?? 'medium'] ?? 50,
        module: event.product,
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
    logPlatformEvent({
      domain: 'pulse',
      level: 'error',
      action: 'pulse.mirror_failed',
      message: 'ActivityEvents mirror failed',
      organizationId: EA_INTERNAL_ORG_ID,
      tenantId: event.tenantId,
      metadata: { error: String(err) },
    });
  }
}

async function persistPulseEventTable(
  event: StoredPulseEvent,
  correlationId?: string,
): Promise<void> {
  const hasCredentials =
    platformStoreConfigured() ||
    Boolean(
      (process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT) &&
        process.env.AIRTABLE_PAYMENTS_BASE_ID,
    );
  if (!hasCredentials) return;

  const metadataJson = JSON.stringify({
    ...(event.metadata ?? {}),
    correlationId,
  });

  try {
    if (platformStoreConfigured()) {
      const created = await platformCreate(PULSE_EVENTS_TABLE, {
        Product: event.product,
        'Event Type': event.type,
        Title: event.title,
        Detail: event.detail ?? '',
        Priority: event.priority ?? 'medium',
        URL: event.href ?? '',
        'Tenant ID': event.tenantId ?? '',
        'Object ID': event.objectId ?? '',
        'Recorded At': event.at,
        'Metadata JSON': metadataJson,
      });
      if (!created) {
        await fallbackPulseFetchPersist(event, metadataJson, correlationId);
      }
      return;
    }

    await fallbackPulseFetchPersist(event, metadataJson, correlationId);
  } catch (err) {
    await handlePulsePersistFailure(event, err, correlationId);
  }
}

async function fallbackPulseFetchPersist(
  event: StoredPulseEvent,
  metadataJson: string,
  correlationId?: string,
): Promise<void> {
  const key = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_PAYMENTS_BASE_ID;
  if (!key || !baseId) return;

  const res = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(PULSE_EVENTS_TABLE)}`,
    {
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
              'Recorded At': event.at,
              'Metadata JSON': metadataJson,
            },
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Airtable ${res.status}: ${detail.slice(0, 200)}`);
  }
}

async function handlePulsePersistFailure(
  event: StoredPulseEvent,
  err: unknown,
  correlationId?: string,
): Promise<void> {
  logPlatformEvent({
    domain: 'pulse',
    level: 'error',
    action: 'pulse.persist_failed',
    message: 'Pulse Events table write failed',
    organizationId: EA_INTERNAL_ORG_ID,
    tenantId: event.tenantId,
    correlationId,
    metadata: { error: String(err) },
  });

  void recordPlatformAuditEvent({
    organizationId: EA_INTERNAL_ORG_ID,
    action: 'pulse.persist_failed',
    targetType: 'pulse_event',
    targetId: `${event.product}:${event.type}`,
    summary: `Persist failed: ${event.title}`,
    tenantId: event.tenantId,
    correlationId,
    metadata: { error: String(err) },
  });
}
