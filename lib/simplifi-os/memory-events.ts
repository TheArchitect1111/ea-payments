import { emitPulseEvent } from '@/lib/pulse-bus';
import { isSimplifiOsWriteEnabled, isSimplifiOsConfigured } from './flags';
import { supabaseRest } from './supabase';
import type { RecordMemoryEventInput } from './types';

export type RecordMemoryEventResult =
  | { ok: true; id?: string; skipped?: boolean }
  | { ok: false; error: string };

/**
 * Append-only Memory Event. When OS write is off / Supabase missing, still
 * bridges high-signal events to Pulse when possible (platform activity).
 */
export async function recordMemoryEvent(
  input: RecordMemoryEventInput,
): Promise<RecordMemoryEventResult> {
  const portalSlug = input.portalSlug.trim();
  if (!portalSlug) return { ok: false, error: 'portalSlug required' };

  // Best-effort Pulse bridge for capture/opportunity lifecycle
  if (
    input.eventType === 'capture.created' ||
    input.eventType === 'opportunity.created' ||
    input.eventType === 'opportunity.updated'
  ) {
    try {
      await emitPulseEvent({
        product: 'simplifi',
        type:
          input.eventType === 'opportunity.updated' ? 'capture.outcome_recorded' : 'capture.completed',
        title: String(input.metadata?.title ?? input.eventType),
        detail: input.eventType,
        href: '/simplifi/workspace',
        objectId: input.objectId ?? input.correlationId,
        tenantId: portalSlug,
        priority: 'medium',
      });
    } catch {
      // Pulse must never block OS memory
    }
  }

  if (!isSimplifiOsWriteEnabled() || !isSimplifiOsConfigured()) {
    return { ok: true, skipped: true };
  }

  const row = {
    portal_slug: portalSlug,
    event_type: input.eventType,
    object_id: input.objectId ?? null,
    actor_id: input.actorId ?? null,
    actor_type: input.actorType ?? 'user',
    client: input.client ?? null,
    object_ids: input.objectIds ?? (input.objectId ? [input.objectId] : null),
    related_object_ids: input.relatedObjectIds ?? null,
    correlation_id: input.correlationId ?? null,
    metadata: input.metadata ?? {},
    payload: input.payload ?? input.metadata ?? {},
  };

  const result = await supabaseRest<Array<{ id: string }>>('simplifi_memory_events', {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify(row),
  });

  if (!result.ok) {
    console.error('[simplifi-os] recordMemoryEvent failed', result.error);
    return { ok: false, error: result.error };
  }

  const id = Array.isArray(result.data) ? result.data[0]?.id : undefined;
  return { ok: true, id };
}
