export type ContextItem = {
  id?: string;
  text: string;
  source?: string;
  priority?: number;
  createdAt?: string;
};

export type TaskState = {
  goal: string;
  completed?: string[];
  blockers?: string[];
  nextAction?: string;
  constraints?: string[];
};

export type OptimizeContextInput = {
  query: string;
  items: ContextItem[];
  taskState?: TaskState;
  maxItems?: number;
  maxChars?: number;
};

export type OptimizeContextResult = {
  context: string;
  selected: ContextItem[];
  stats: {
    inputChars: number;
    outputChars: number;
    reductionRatio: number;
    selectedItems: number;
    totalItems: number;
    compressor: 'llmlingua' | 'heuristic';
  };
};

const STOP_WORDS = new Set([
  'a','an','and','are','as','at','be','but','by','for','from','had','has','have','he','her','his','i','in','is','it','its','of','on','or','our','she','that','the','their','them','they','this','to','was','we','were','will','with','you','your',
]);

function terms(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term));
}

function scoreItem(queryTerms: Set<string>, item: ContextItem): number {
  const itemTerms = terms(item.text);
  if (!itemTerms.length) return 0;
  const overlap = itemTerms.reduce((score, term) => score + (queryTerms.has(term) ? 1 : 0), 0);
  const density = overlap / Math.max(8, itemTerms.length);
  const priority = Math.max(0, Math.min(10, item.priority ?? 0)) * 0.08;
  const exactPhrase = queryTerms.size > 1 && item.text.toLowerCase().includes([...queryTerms].join(' ')) ? 1 : 0;
  return overlap + density + priority + exactPhrase;
}

function compactState(state?: TaskState): string {
  if (!state) return '';
  const lines = [
    `GOAL: ${state.goal}`,
    state.completed?.length ? `DONE: ${state.completed.join(' | ')}` : '',
    state.blockers?.length ? `BLOCKERS: ${state.blockers.join(' | ')}` : '',
    state.nextAction ? `NEXT: ${state.nextAction}` : '',
    state.constraints?.length ? `CONSTRAINTS: ${state.constraints.join(' | ')}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

function trimToBudget(chunks: string[], maxChars: number): string {
  const kept: string[] = [];
  let used = 0;
  for (const chunk of chunks) {
    const remaining = maxChars - used;
    if (remaining <= 0) break;
    const next = chunk.length <= remaining ? chunk : chunk.slice(0, Math.max(0, remaining - 1)).trimEnd() + '…';
    if (next) {
      kept.push(next);
      used += next.length + 2;
    }
  }
  return kept.join('\n\n');
}

async function compressWithLlmlingua(text: string): Promise<string | null> {
  const endpoint = process.env.LLMLINGUA_ENDPOINT?.trim();
  if (!endpoint) return null;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.LLMLINGUA_API_KEY ? { authorization: `Bearer ${process.env.LLMLINGUA_API_KEY}` } : {}),
      },
      body: JSON.stringify({ text, target_rate: Number(process.env.LLMLINGUA_TARGET_RATE ?? 0.5) }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { compressed_text?: string; text?: string };
    return (payload.compressed_text ?? payload.text ?? '').trim() || null;
  } catch {
    return null;
  }
}

export async function optimizeContext(input: OptimizeContextInput): Promise<OptimizeContextResult> {
  const maxItems = Math.max(1, input.maxItems ?? 12);
  const maxChars = Math.max(500, input.maxChars ?? 12_000);
  const queryTerms = new Set(terms(input.query));
  const ranked = input.items
    .map((item, index) => ({ item, index, score: scoreItem(queryTerms, item) }))
    .sort((a, b) => b.score - a.score || b.index - a.index)
    .slice(0, maxItems)
    .map(({ item }) => item);

  const state = compactState(input.taskState);
  const chunks = [state, ...ranked.map((item) => item.source ? `[${item.source}] ${item.text}` : item.text)].filter(Boolean);
  const filtered = trimToBudget(chunks, maxChars);
  const llmlingua = await compressWithLlmlingua(filtered);
  const context = llmlingua ?? filtered;
  const inputChars = input.items.reduce((sum, item) => sum + item.text.length, 0) + state.length;
  const outputChars = context.length;

  return {
    context,
    selected: ranked,
    stats: {
      inputChars,
      outputChars,
      reductionRatio: inputChars > 0 ? 1 - outputChars / inputChars : 0,
      selectedItems: ranked.length,
      totalItems: input.items.length,
      compressor: llmlingua ? 'llmlingua' : 'heuristic',
    },
  };
}
