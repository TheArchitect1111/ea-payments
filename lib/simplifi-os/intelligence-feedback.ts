import { isSimplifiIntelligenceEnabled, isSimplifiOsConfigured } from './flags';
import { recordMemoryEvent } from './memory-events';
import { supabaseRest } from './supabase';
import type { MemoryEventType } from './types';

export type IntelligenceFeedbackAction =
  | 'viewed'
  | 'opened'
  | 'completed'
  | 'deferred'
  | 'dismissed'
  | 'ignored'
  | 'helpful'
  | 'incorrect';

const ACTION_TO_STATUS: Partial<Record<IntelligenceFeedbackAction, string>> = {
  completed: 'completed',
  dismissed: 'dismissed',
  deferred: 'deferred',
  ignored: 'ignored',
};

const ACTION_TO_EVENT: Partial<Record<IntelligenceFeedbackAction, MemoryEventType>> = {
  completed: 'reminder.completed',
  dismissed: 'reminder.ignored',
  deferred: 'reminder.created',
  ignored: 'reminder.ignored',
};

/**
 * Record user feedback on an intelligence recommendation.
 * Always scopes by portalSlug (caller must enforce session slug match).
 */
export async function applyIntelligenceFeedback(input: {
  portalSlug: string;
  itemId: string;
  action: IntelligenceFeedbackAction;
  actorId?: string;
  deferUntil?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSimplifiIntelligenceEnabled() || !isSimplifiOsConfigured()) {
    return { ok: false, error: 'Intelligence feedback unavailable.' };
  }

  const existing = await supabaseRest<
    Array<{ id: string; portal_slug: string; related_object_ids: string[] | null; title: string }>
  >(
    `simplifi_intelligence_items?id=eq.${encodeURIComponent(input.itemId)}&portal_slug=eq.${encodeURIComponent(input.portalSlug)}&select=id,portal_slug,related_object_ids,title&limit=1`,
    { method: 'GET' },
  );

  if (!existing.ok || !Array.isArray(existing.data) || !existing.data[0]) {
    return { ok: false, error: 'Recommendation not found.' };
  }

  const patch: Record<string, unknown> = {
    feedback_state: input.action,
    updated_at: new Date().toISOString(),
  };
  const status = ACTION_TO_STATUS[input.action];
  if (status) patch.status = status;
  if (input.action === 'deferred') {
    patch.reevaluate_at =
      input.deferUntil || new Date(Date.now() + 3 * 86_400_000).toISOString();
    patch.status = 'deferred';
  }

  const updated = await supabaseRest(
    `simplifi_intelligence_items?id=eq.${encodeURIComponent(input.itemId)}&portal_slug=eq.${encodeURIComponent(input.portalSlug)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    },
  );

  if (!updated.ok) return { ok: false, error: updated.error };

  const eventType = ACTION_TO_EVENT[input.action] ?? 'intelligence.finding';
  await recordMemoryEvent({
    portalSlug: input.portalSlug,
    eventType,
    actorId: input.actorId,
    client: 'web',
    objectIds: existing.data[0].related_object_ids ?? undefined,
    correlationId: input.itemId,
    metadata: {
      feedback: input.action,
      recommendation_id: input.itemId,
      title: existing.data[0].title,
    },
  });

  return { ok: true };
}
