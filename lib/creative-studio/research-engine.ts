import type { BrandProfile, CampaignBrief, CampaignResearch, CampaignStrategy, ResearchSource } from './types';

type SearchHit = { title?: string; url?: string; content?: string; snippet?: string; publishedDate?: string };

function safeUrl(value: unknown): string {
  const text = String(value || '').trim();
  try {
    const url = new URL(text);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function domainOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

function parseJsonText(text: string): unknown {
  const cleaned = text.trim().replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/, '');
  try { return JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
    }
    return null;
  }
}

function makeSource(hit: SearchHit, index: number, now: string): ResearchSource | null {
  const url = safeUrl(hit.url);
  if (!url) return null;
  const summary = String(hit.content || hit.snippet || '').trim().slice(0, 900);
  return {
    id: `source-${index + 1}`,
    title: String(hit.title || domainOf(url)).trim().slice(0, 240),
    url,
    domain: domainOf(url),
    publishedAt: hit.publishedDate ? String(hit.publishedDate) : undefined,
    accessedAt: now,
    summary,
    supportedFacts: summary ? [summary] : [],
    confidence: 'medium',
  };
}

async function searchSearxng(query: string): Promise<SearchHit[]> {
  const endpoint = process.env.SEARXNG_URL?.trim();
  if (!endpoint) return [];
  const url = new URL('/search', endpoint.endsWith('/') ? endpoint : `${endpoint}/`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('language', 'en');
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(18_000) });
  if (!response.ok) return [];
  const data = await response.json() as { results?: Array<{ title?: string; url?: string; content?: string; publishedDate?: string }> };
  return (data.results || []).slice(0, 8);
}

async function searchWithOpenAI(query: string, context: Record<string, unknown>): Promise<{
  summary: string;
  hits: SearchHit[];
}> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return { summary: '', hits: [] };
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_RESEARCH_MODEL?.trim() || 'gpt-4.1-mini',
      tools: [{ type: 'web_search' }],
      input: [
        {
          role: 'system',
          content: 'Research timely, relevant information for a social campaign. Prefer primary and authoritative sources. Do not invent facts. Return JSON only with summary and sources. Each source needs title, url, publishedDate when known, summary, and supportedFacts.',
        },
        {
          role: 'user',
          content: JSON.stringify({ query, context, output: { summary: 'string', sources: [{ title: 'string', url: 'https://...', publishedDate: 'optional', summary: 'string', supportedFacts: ['string'] }] } }),
        },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) return { summary: '', hits: [] };
  const data = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const text = data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text || '').join('\n') || '';
  const parsed = parseJsonText(text) as { summary?: string; sources?: Array<SearchHit & { supportedFacts?: string[] }> } | null;
  return { summary: String(parsed?.summary || ''), hits: Array.isArray(parsed?.sources) ? parsed.sources.slice(0, 8) : [] };
}

export async function researchCampaign(input: {
  story: string;
  brief: CampaignBrief;
  strategy: CampaignStrategy;
  brand: BrandProfile;
}): Promise<CampaignResearch> {
  const now = new Date().toISOString();
  const query = [
    input.brand.organizationName,
    input.strategy.objective,
    input.strategy.audience,
    input.strategy.contentPillars.join(' '),
    input.brief.title,
  ].filter(Boolean).join(' — ').slice(0, 700);
  const warnings: string[] = [];

  let hits: SearchHit[] = [];
  let summary = '';
  try {
    hits = await searchSearxng(query);
  } catch {
    warnings.push('The configured open-source search provider was unavailable.');
  }

  if (!hits.length) {
    try {
      const result = await searchWithOpenAI(query, {
        organization: input.brand.organizationName,
        objective: input.strategy.objective,
        audience: input.strategy.audience,
        story: input.story,
        contentPillars: input.strategy.contentPillars,
      });
      hits = result.hits;
      summary = result.summary;
    } catch {
      warnings.push('Live web research was unavailable.');
    }
  }

  const sources = hits.map((hit, index) => {
    const source = makeSource(hit, index, now);
    const facts = (hit as SearchHit & { supportedFacts?: unknown }).supportedFacts;
    if (source && Array.isArray(facts)) {
      source.supportedFacts = facts.map(String).map((fact) => fact.trim()).filter(Boolean).slice(0, 6);
    }
    return source;
  }).filter((source): source is ResearchSource => Boolean(source));

  if (!summary && sources.length) {
    summary = sources.map((source) => source.summary).filter(Boolean).slice(0, 3).join(' ');
  }
  if (!sources.length) warnings.push('No verified external sources were added; posts use only the supplied brief and strategy pack.');

  return {
    status: sources.length >= 2 ? 'complete' : sources.length ? 'partial' : 'unavailable',
    query,
    summary: summary.slice(0, 2400),
    sources,
    generatedAt: now,
    warnings,
  };
}
