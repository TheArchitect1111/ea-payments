/**
 * Conversational Ask over workspace opportunity data — intent + light retrieval.
 * Replaces FAQ-only regex answers with answers grounded in the user's objects.
 */
import type { SimplifiObject } from './simplifi-objects';
import type { ActionCenterPayload } from './action-center';
import { answerAskSimplifi } from './simplifi-guidance-system';

function scoreMatch(obj: SimplifiObject, terms: string[]): number {
  const hay = `${obj.title} ${obj.nextAction} ${obj.whyThisMatters} ${obj.type} ${obj.savePurpose ?? ''} ${obj.owner ?? ''}`.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (term.length < 2) continue;
    if (hay.includes(term)) score += term.length > 4 ? 3 : 2;
  }
  return score;
}

export function answerConversationalAsk(
  question: string,
  objects: SimplifiObject[],
  actionCenter: ActionCenterPayload,
): string {
  const trimmed = question.trim();
  if (!trimmed) {
    return 'Ask what changed, what matters most, or search for a person, company, or follow-up.';
  }

  const text = trimmed.toLowerCase();
  const terms = text.split(/[^a-z0-9]+/).filter(Boolean);

  if (/what (changed|matters)|what'?s (fading|due|next)|priority|focus|today/.test(text)) {
    const attention = actionCenter.needsAttention[0];
    const top = objects[0];
    if (attention) {
      return `What matters now: ${attention.title}. ${attention.detail}${top ? ` Top opportunity: "${top.title}" — next: ${top.nextAction}.` : ''}`;
    }
    if (top) {
      return `Focus on "${top.title}". Next move: ${top.nextAction}.${top.dueDate ? ` Target: ${top.dueDate}.` : ''}`;
    }
    return 'Nothing urgent yet. Capture something worth remembering and Simplifi will surface what matters.';
  }

  if (/follow[- ]?up|due|deadline|calendar|when/.test(text)) {
    const withDue = objects
      .filter((o) => o.dueDate)
      .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
    if (withDue.length === 0) {
      return 'No dated follow-ups yet. Open an opportunity and set a next action date, or ask the Orb to capture a reminder.';
    }
    const lines = withDue.slice(0, 4).map((o) => `· ${o.dueDate}: ${o.title} — ${o.nextAction}`);
    return `Upcoming follow-ups:\n${lines.join('\n')}`;
  }

  if (/fading|stale|aging|cold/.test(text)) {
    const stale = actionCenter.needsAttention.filter((i) => /stale|overdue|aging|fading/i.test(`${i.title} ${i.detail}`));
    if (stale.length > 0) {
      return `Fading signals:\n${stale.slice(0, 3).map((i) => `· ${i.title}: ${i.detail}`).join('\n')}`;
    }
    const older = [...objects].sort(
      (a, b) => new Date(a.dateCaptured).getTime() - new Date(b.dateCaptured).getTime(),
    )[0];
    return older
      ? `"${older.title}" is among your oldest open items. Next: ${older.nextAction}.`
      : 'No fading opportunities right now.';
  }

  const ranked = objects
    .map((obj) => ({ obj, score: scoreMatch(obj, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length > 0) {
    const best = ranked[0].obj;
    const profile = `/simplifi/opportunity/${best.id}`;
    const more =
      ranked.length > 1
        ? ` Also related: ${ranked
            .slice(1, 3)
            .map((r) => r.obj.title)
            .join('; ')}.`
        : '';
    return `Closest match: "${best.title}". Next: ${best.nextAction}. Open profile: ${profile}.${more}`;
  }

  return answerAskSimplifi(trimmed, objects, actionCenter);
}

export function searchOpportunities(query: string, objects: SimplifiObject[]): SimplifiObject[] {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
  if (terms.length === 0) return objects;
  return objects
    .map((obj) => ({ obj, score: scoreMatch(obj, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.obj);
}
