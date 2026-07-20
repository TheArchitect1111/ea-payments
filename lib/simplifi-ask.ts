/**
 * Conversational Ask over workspace opportunity data — intent + light retrieval.
 * Replaces FAQ-only regex answers with answers grounded in the user's objects.
 */
import type { SimplifiObject } from './simplifi-objects';
import type { ActionCenterPayload } from './action-center';
import { answerAskSimplifi } from './simplifi-guidance-system';

export type AskCitation = {
  id: string;
  title: string;
  href: string;
};

export type ConversationalAskResult = {
  answer: string;
  citations: AskCitation[];
};

function citationFor(obj: SimplifiObject): AskCitation {
  return {
    id: obj.id,
    title: obj.title,
    href: `/simplifi/opportunity/${obj.id}`,
  };
}

function scoreMatch(obj: SimplifiObject, terms: string[]): number {
  const hay = `${obj.title} ${obj.nextAction} ${obj.whyThisMatters} ${obj.type} ${obj.savePurpose ?? ''} ${obj.owner ?? ''}`.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (term.length < 2) continue;
    if (hay.includes(term)) score += term.length > 4 ? 3 : 2;
  }
  return score;
}

export function answerConversationalAskDetailed(
  question: string,
  objects: SimplifiObject[],
  actionCenter: ActionCenterPayload,
): ConversationalAskResult {
  const trimmed = question.trim();
  if (!trimmed) {
    return {
      answer: 'Ask what changed, what matters most, or search for a person, company, or follow-up.',
      citations: [],
    };
  }

  const text = trimmed.toLowerCase();
  const terms = text.split(/[^a-z0-9]+/).filter(Boolean);

  if (/what (changed|matters)|what'?s (fading|due|next)|priority|focus|today/.test(text)) {
    const attention = actionCenter.needsAttention[0];
    const top = objects[0];
    if (attention) {
      return {
        answer: `What matters now: ${attention.title}. ${attention.detail}${top ? ` Top opportunity: "${top.title}" — next: ${top.nextAction}.` : ''}`,
        citations: top ? [citationFor(top)] : [],
      };
    }
    if (top) {
      return {
        answer: `Focus on "${top.title}". Next move: ${top.nextAction}.${top.dueDate ? ` Target: ${top.dueDate}.` : ''}`,
        citations: [citationFor(top)],
      };
    }
    return {
      answer: 'Nothing urgent yet. Capture something worth remembering and Simplifi will surface what matters.',
      citations: [],
    };
  }

  if (/follow[- ]?up|due|deadline|calendar|when/.test(text)) {
    const withDue = objects
      .filter((o) => o.dueDate)
      .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
    if (withDue.length === 0) {
      return {
        answer:
          'No dated follow-ups yet. Open an opportunity and set a next action date, or ask the Orb to capture a reminder.',
        citations: [],
      };
    }
    const lines = withDue.slice(0, 4).map((o) => `· ${o.dueDate}: ${o.title} — ${o.nextAction}`);
    return {
      answer: `Upcoming follow-ups:\n${lines.join('\n')}`,
      citations: withDue.slice(0, 4).map(citationFor),
    };
  }

  if (/fading|stale|aging|cold/.test(text)) {
    const stale = actionCenter.needsAttention.filter((i) =>
      /stale|overdue|aging|fading/i.test(`${i.title} ${i.detail}`),
    );
    if (stale.length > 0) {
      const staleObjs = stale
        .map((s) => objects.find((o) => o.id === s.id || o.title === s.title))
        .filter((o): o is SimplifiObject => Boolean(o));
      return {
        answer: `Fading signals:\n${stale.slice(0, 3).map((i) => `· ${i.title}: ${i.detail}`).join('\n')}`,
        citations: staleObjs.slice(0, 3).map(citationFor),
      };
    }
    const older = [...objects].sort(
      (a, b) => new Date(a.dateCaptured).getTime() - new Date(b.dateCaptured).getTime(),
    )[0];
    return older
      ? {
          answer: `"${older.title}" is among your oldest open items. Next: ${older.nextAction}.`,
          citations: [citationFor(older)],
        }
      : { answer: 'No fading opportunities right now.', citations: [] };
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
    return {
      answer: `Closest match: "${best.title}". Next: ${best.nextAction}. Open profile: ${profile}.${more}`,
      citations: ranked.slice(0, 3).map((r) => citationFor(r.obj)),
    };
  }

  return {
    answer: answerAskSimplifi(trimmed, objects, actionCenter),
    citations: [],
  };
}

export function answerConversationalAsk(
  question: string,
  objects: SimplifiObject[],
  actionCenter: ActionCenterPayload,
): string {
  return answerConversationalAskDetailed(question, objects, actionCenter).answer;
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
