export type ResearchSubject = {
  id: string;
  label: string;
  query: string;
  trustedSources?: string[];
  active: boolean;
};

export type IntelligenceItem = {
  id: string;
  subjectId: string;
  title: string;
  url: string;
  domain: string;
  summary: string;
  supportedFacts: string[];
  publishedAt?: string;
  discoveredAt: string;
  relevance: number;
  confidence: 'high' | 'medium' | 'low';
};

export type SmartResearchSnapshot = {
  generatedAt: string;
  subjects: ResearchSubject[];
  items: IntelligenceItem[];
  warnings: string[];
};

const MAX_SUBJECTS = 3;

function safeUrl(value: unknown) {
  try {
    const url = new URL(String(value || ''));
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch { return ''; }
}

function domainOf(value: string) {
  try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return ''; }
}

function words(value: string) {
  return new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2));
}

function relevance(query: string, title: string, summary: string) {
  const wanted = words(query);
  if (!wanted.size) return 0;
  const found = words(`${title} ${summary}`);
  let matches = 0;
  wanted.forEach((word) => { if (found.has(word)) matches += 1; });
  return Math.round((matches / wanted.size) * 100);
}

async function searx(query: string) {
  const endpoint = process.env.SEARXNG_URL?.trim();
  if (!endpoint) return [] as Array<Record<string, unknown>>;
  const url = new URL('/search', endpoint.endsWith('/') ? endpoint : `${endpoint}/`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('language', 'en');
  url.searchParams.set('time_range', 'month');
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(18000) });
  if (!response.ok) return [];
  const data = await response.json() as { results?: Array<Record<string, unknown>> };
  return (data.results || []).slice(0, 12);
}

async function openAiSearch(query: string) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return [] as Array<Record<string, unknown>>;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_RESEARCH_MODEL?.trim() || 'gpt-4.1-mini',
      tools: [{ type: 'web_search' }],
      input: `Research this subject for a marketing intelligence system: ${query}. Prefer recent primary and authoritative sources. Return JSON only: {"sources":[{"title":"","url":"","summary":"","publishedAt":"","supportedFacts":[""]}]}. Never invent facts or URLs.`,
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) return [];
  const data = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const text = data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text || '').join('\n') || '';
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return (JSON.parse(cleaned).sources || []).slice(0, 12); } catch { return []; }
}

export function validateResearchSubjects(subjects: ResearchSubject[]) {
  const active = subjects.filter((subject) => subject.active);
  if (active.length > MAX_SUBJECTS) throw new Error('Smart Research supports up to three active subjects.');
  if (active.some((subject) => !subject.label.trim() || !subject.query.trim())) throw new Error('Every active research subject needs a label and query.');
  return active;
}

export async function runSmartResearch(subjects: ResearchSubject[]): Promise<SmartResearchSnapshot> {
  const active = validateResearchSubjects(subjects);
  const generatedAt = new Date().toISOString();
  const warnings: string[] = [];
  const items: IntelligenceItem[] = [];

  for (const subject of active) {
    const preferred = subject.trustedSources?.filter(Boolean) || [];
    const query = `${subject.query}${preferred.length ? ` preferred sources ${preferred.join(' ')}` : ''}`.slice(0, 700);
    let hits: Array<Record<string, unknown>> = [];
    try { hits = await searx(query); } catch { warnings.push(`${subject.label}: open-source search unavailable.`); }
    if (!hits.length) {
      try { hits = await openAiSearch(query); } catch { warnings.push(`${subject.label}: web research unavailable.`); }
    }
    if (!hits.length) warnings.push(`${subject.label}: no verified sources found.`);

    hits.forEach((hit, index) => {
      const url = safeUrl(hit.url);
      if (!url) return;
      const title = String(hit.title || domainOf(url)).trim().slice(0, 240);
      const summary = String(hit.summary || hit.content || hit.snippet || '').trim().slice(0, 1200);
      const facts = Array.isArray(hit.supportedFacts) ? hit.supportedFacts.map(String).map((fact) => fact.trim()).filter(Boolean).slice(0, 8) : summary ? [summary] : [];
      const score = relevance(subject.query, title, summary);
      items.push({
        id: `${subject.id}-${index + 1}`,
        subjectId: subject.id,
        title,
        url,
        domain: domainOf(url),
        summary,
        supportedFacts: facts,
        publishedAt: String(hit.publishedAt || hit.publishedDate || '') || undefined,
        discoveredAt: generatedAt,
        relevance: score,
        confidence: preferred.some((source) => domainOf(url).includes(source.replace(/^www\./, ''))) ? 'high' : score >= 50 ? 'high' : score >= 20 ? 'medium' : 'low',
      });
    });
  }

  const deduped = [...new Map(items.map((item) => [item.url, item])).values()]
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 30);
  return { generatedAt, subjects: active, items: deduped, warnings };
}
