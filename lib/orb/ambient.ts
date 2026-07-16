import type { ActionCenterPayload } from '@/lib/action-center';
import { buildAmbientOpening } from '@/lib/orb-os';
import type { OrbBriefSlice } from './types';

/**
 * Attention titles from Action Center + Brief only (no invented insights).
 * Prefers needsAttention, then brief items; dedupes by lowercase title.
 */
export function collectAmbientAttentionTitles(
  brief: OrbBriefSlice,
  actionCenter: ActionCenterPayload,
  limit = 3,
): string[] {
  const seen = new Set<string>();
  const titles: string[] = [];

  for (const item of [
    ...actionCenter.needsAttention,
    ...brief.items,
    ...actionCenter.recommended,
  ]) {
    const title = item.title?.trim();
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    titles.push(title);
    if (titles.length >= limit) break;
  }

  return titles;
}

/** Full conversational opener for Orb expand (reuses buildAmbientOpening). */
export function buildAmbientOpeningFromSession(input: {
  brief: OrbBriefSlice;
  actionCenter: ActionCenterPayload;
}): string {
  return buildAmbientOpening({
    greeting: input.brief.greeting,
    attentionTitles: collectAmbientAttentionTitles(input.brief, input.actionCenter),
  });
}

/**
 * Short lead line for Brief load — count only, no numbered list
 * (the Brief page already lists the items).
 */
export function buildBriefAmbientLead(input: {
  brief: OrbBriefSlice;
  actionCenter: ActionCenterPayload;
}): string {
  const count = collectAmbientAttentionTitles(input.brief, input.actionCenter).length;
  if (count === 0) return 'Nothing urgent is waiting.';
  return `${count} thing${count === 1 ? '' : 's'} deserve${count === 1 ? 's' : ''} your attention today.`;
}
