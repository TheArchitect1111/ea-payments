/**
 * Language → surface intent for Orb OS.
 * Reuses existing Simplifi routes/engines; does not invent new backends.
 */

export type OrbSurface =
  | 'home'
  | 'brief'
  | 'capture'
  | 'inbox'
  | 'followups'
  | 'calendar'
  | 'ask'
  | 'search'
  | 'settings'
  | 'portal'
  | 'classic';

export type OrbIntent = {
  surface: OrbSurface;
  /** Spoken/typed reply Orb should show */
  reply: string;
  /** Optional draft for capture */
  draft?: string;
  /** Search / ask query */
  query?: string;
};

const CAPTURE =
  /\b(capture|save|remember|note|jot|record|bookmark|upload|screenshot|photo)\b/i;
const BRIEF =
  /\b(brief|priorit(y|ies)|today|what matters|attention|morning|what changed|what'?s fading)\b/i;
const INBOX =
  /\b(inbox|opportunit(y|ies)|show (my )?(captures|leads)|opportunity (center|list))\b/i;
const FOLLOWUPS = /\b(follow[- ]?ups?|due|deadline|snooze|commitments?)\b/i;
const CALENDAR = /\b(calendar|schedule|when is|dates?)\b/i;
const SETTINGS = /\b(settings?|preferences?|account)\b/i;
const PORTAL = /\b(portal|dashboard home)\b/i;
const CLASSIC =
  /\b(classic|old (ui|interface|simplifi)|exit orb|leave orb|traditional)\b/i;
const SEARCH =
  /\b(find|search|show me|look up|related to|everything about|leads? about|proposals?)\b/i;

export function interpretOrbIntent(utterance: string): OrbIntent {
  const text = utterance.trim();
  if (!text) {
    return {
      surface: 'home',
      reply: 'I am here. Capture something, ask for today\'s priorities, or say "show opportunities."',
    };
  }

  if (CLASSIC.test(text)) {
    return {
      surface: 'classic',
      reply: 'Opening classic Simplifi — Brief, Capture, and Inbox stay available anytime.',
    };
  }

  if (SETTINGS.test(text)) {
    return { surface: 'settings', reply: 'Opening settings.' };
  }

  if (PORTAL.test(text)) {
    return { surface: 'portal', reply: 'Opening your portal.' };
  }

  if (CAPTURE.test(text)) {
    const draft = text
      .replace(/^(please\s+)?(can you\s+)?(capture|save|remember|note|jot)\s*(this|that|an idea|a note)?[:\s-]*/i, '')
      .trim();
    return {
      surface: 'capture',
      reply: draft
        ? 'Capture is ready — I will hold what you shared.'
        : 'Capture is open. Paste a link, speak, or type what matters.',
      draft: draft || undefined,
    };
  }

  if (FOLLOWUPS.test(text) && !BRIEF.test(text)) {
    return { surface: 'followups', reply: 'Here are your follow-ups and dated commitments.' };
  }

  if (CALENDAR.test(text)) {
    return { surface: 'calendar', reply: 'Opportunity calendar — deadlines and commitments only.' };
  }

  if (INBOX.test(text)) {
    return { surface: 'inbox', reply: 'Your opportunities, ordered by what deserves attention.' };
  }

  if (BRIEF.test(text)) {
    return {
      surface: 'brief',
      reply: 'Today\'s Brief — what deserves your attention.',
    };
  }

  if (SEARCH.test(text)) {
    const query = text
      .replace(/^(please\s+)?(can you\s+)?(find|search|show me|look up)\s*/i, '')
      .trim();
    return {
      surface: 'search',
      reply: query ? `Searching for “${query}”.` : 'What should I find?',
      query: query || text,
    };
  }

  return {
    surface: 'ask',
    reply: 'I will answer from your workspace.',
    query: text,
  };
}

/** Ambient morning line from existing brief / action center data. Value-first — never chatbot greeting. */
export function buildAmbientOpening(input: {
  greeting: string;
  attentionTitles: string[];
}): string {
  const nameMatch = input.greeting.match(/,\s*([^.]+)/);
  const name = nameMatch?.[1]?.trim();
  const hello = name ? `Good morning, ${name}.` : input.greeting.replace(/\.$/, '') + '.';
  if (input.attentionTitles.length === 0) {
    return `${hello}\nNothing urgent is waiting. Your day is clear.`;
  }
  const lines = input.attentionTitles.slice(0, 3).map((t, i) => `${i + 1}. ${t}`);
  const count = lines.length;
  return `${hello}\nWhile you were away, I found ${count} thing${count === 1 ? '' : 's'} that deserve${count === 1 ? 's' : ''} attention:\n${lines.join('\n')}`;
}
