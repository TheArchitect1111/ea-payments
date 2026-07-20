/**
 * In-tab Ask Q/A history (sessionStorage only — no backend).
 */

export type AskHistoryCitation = {
  id: string;
  title: string;
  href: string;
};

export type AskHistoryItem = {
  id: string;
  question: string;
  answer: string;
  citations: AskHistoryCitation[];
  at: string;
};

const KEY = 'simplifi-ask-history';
const MAX_ITEMS = 12;

export function loadAskHistory(): AskHistoryItem[] {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AskHistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function pushAskHistory(item: {
  question: string;
  answer: string;
  citations?: AskHistoryCitation[];
}): AskHistoryItem[] {
  const next: AskHistoryItem = {
    id: `ask-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    question: item.question.trim().slice(0, 500),
    answer: item.answer.slice(0, 4000),
    citations: (item.citations ?? []).slice(0, 5),
    at: new Date().toISOString(),
  };
  const history = [next, ...loadAskHistory().filter((h) => h.question !== next.question)].slice(
    0,
    MAX_ITEMS,
  );
  try {
    sessionStorage.setItem(KEY, JSON.stringify(history));
  } catch {
    // quota / private mode — ignore
  }
  return history;
}

export function clearAskHistory(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
