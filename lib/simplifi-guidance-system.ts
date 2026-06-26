import type { ActionCenterPayload } from './action-center';
import type { SimplifiObject } from './simplifi-objects';

export type SimplifiContextLessonId =
  | 'first-voice-capture'
  | 'first-browser-capture'
  | 'first-note-capture'
  | 'first-watch-list'
  | 'first-reminder';

export interface SimplifiContextLesson {
  id: SimplifiContextLessonId;
  title: string;
  body: string;
}

const LESSONS: Record<SimplifiContextLessonId, SimplifiContextLesson> = {
  'first-voice-capture': {
    id: 'first-voice-capture',
    title: 'Voice notes organize themselves',
    body: 'Simplifi summarizes what you say and turns it into something you can act on later.',
  },
  'first-browser-capture': {
    id: 'first-browser-capture',
    title: 'This context is linked',
    body: 'The page you captured stays connected to the opportunity so you can return to the source.',
  },
  'first-note-capture': {
    id: 'first-note-capture',
    title: 'Loose thoughts are enough',
    body: 'You do not need to format anything. Capture the thought and Simplifi will organize the next move.',
  },
  'first-watch-list': {
    id: 'first-watch-list',
    title: 'Watch Lists learn quietly',
    body: 'As patterns repeat, Simplifi can surface related opportunities without asking you to search again.',
  },
  'first-reminder': {
    id: 'first-reminder',
    title: 'Reminders get smarter',
    body: 'Future reminders can adapt around the follow-up patterns you actually use.',
  },
};

const TEACH_MODE_KEY = 'ea-simplifi-teach-mode-v3';
const LESSON_KEY = 'ea-simplifi-context-lesson-v3';
const COMPANION_EVENT_KEY = 'ea-simplifi-companion-events-v3';

function scopedKey(base: string, scope: string) {
  return `${base}-${scope}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getTeachMeMode(scope: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(scopedKey(TEACH_MODE_KEY, scope)) === '1';
}

export function setTeachMeMode(scope: string, enabled: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(scopedKey(TEACH_MODE_KEY, scope), enabled ? '1' : '0');
}

export function consumeContextLesson(scope: string, id: SimplifiContextLessonId): SimplifiContextLesson | null {
  const key = scopedKey(LESSON_KEY, scope);
  const seen = readJson<string[]>(key, []);
  if (seen.includes(id)) return null;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify([...seen, id]));
  }
  return LESSONS[id];
}

export function recordCompanionEvent(scope: string, event: 'opened' | 'closed' | 'asked' | 'captured') {
  const key = scopedKey(COMPANION_EVENT_KEY, scope);
  const current = readJson<Record<string, number>>(key, {});
  const next = { ...current, [event]: (current[event] ?? 0) + 1 };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(next));
  }
  return next;
}

export function shouldOfferRecovery(scope: string, objects: SimplifiObject[]): boolean {
  const events = readJson<Record<string, number>>(scopedKey(COMPANION_EVENT_KEY, scope), {});
  return objects.length > 0 && (events.opened ?? 0) >= 3 && (events.asked ?? 0) === 0;
}

export function explainRecommendation(input: {
  title: string;
  actionCenter: ActionCenterPayload;
  objects: SimplifiObject[];
}): string {
  const top = input.objects[0];
  const attention = input.actionCenter.needsAttention[0] ?? input.actionCenter.recommended[0];
  if (attention) {
    return `${input.title} is showing because Simplifi found a current signal in your Action Center: ${attention.detail}`;
  }
  if (top) {
    const score = top.opportunityScore != null ? ` It has an opportunity score of ${top.opportunityScore}/100.` : '';
    const due = top.dueDate ? ` It also has a target date of ${top.dueDate}.` : '';
    return `${input.title} is the best next move because it is the most useful active opportunity right now.${score}${due}`;
  }
  return `${input.title} appears because there is no urgent work yet. Capturing the next useful signal gives Simplifi something to organize.`;
}

export function answerAskSimplifi(question: string, objects: SimplifiObject[], actionCenter: ActionCenterPayload): string {
  const text = question.toLowerCase();
  const top = objects[0];
  if (/where|capture|note|inbox/.test(text)) {
    return objects.length > 0
      ? `Your recent captures are in the Capture Inbox. The top item is "${top?.title}", and the next move is: ${top?.nextAction}.`
      : 'Your captures will appear in the Capture Inbox after you save a note, page, file, or idea.';
  }
  if (/why|recommend|priority|seeing/.test(text)) {
    const recommended = actionCenter.needsAttention[0] ?? actionCenter.recommended[0];
    return recommended
      ? `You are seeing this because Simplifi found a timely signal: ${recommended.detail}`
      : 'Simplifi recommends items when they show urgency, momentum, due dates, repeated interest, or a useful next step.';
  }
  if (/watch/.test(text)) {
    return 'Watch Lists appear after Simplifi sees enough related captures. They help group recurring interests without forcing setup first.';
  }
  if (/brief|today|opportunit/.test(text)) {
    return actionCenter.needsAttention.length > 0
      ? `Today's Brief is focused on ${actionCenter.needsAttention[0].title}.`
      : 'The Brief shows only what deserves attention today. If nothing is urgent, it stays quiet.';
  }
  if (/article|page/.test(text)) {
    return 'Use double tap for instant page context, or long press the Orb and say what you want remembered.';
  }
  return 'Ask me where something went, why Simplifi recommended it, or what to do next. I will keep the answer short and action-focused.';
}
