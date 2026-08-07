/**
 * Provider-neutral research interface for the Experience Creation Engine.
 * Prefer existing EA search (OpenAI web_search) → scrapeUrl (Firecrawl optional) → no fabricated facts.
 */
import { scrapeUrl } from '@/lib/firecrawl';

export type ResearchHit = {
  title?: string;
  url: string;
  description?: string;
  provider: string;
};

export type ResearchPage = {
  url: string;
  title: string;
  description?: string;
  text: string;
  imageUrls: string[];
  provider: string;
};

export type ResearchProviderAdapter = {
  id: string;
  configured: boolean;
  search: (query: string) => Promise<ResearchHit[]>;
  fetchPage?: (url: string) => Promise<ResearchPage | null>;
};

async function openAiWebSearch(query: string): Promise<ResearchHit[]> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return [];
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.FACTORY_RESEARCH_MODEL?.trim() || process.env.AI_MODEL_RESEARCH || 'gpt-4.1-mini',
      tools: [{ type: 'web_search' }],
      input: [
        'Research this public subject for a premium website and portal experience.',
        'Prefer official sites, press, interviews, institutional pages, and professional profiles.',
        'Do not invent private facts. Cite sources.',
        `Subject query: ${query}`,
      ].join('\n'),
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`Research search failed (${response.status})`);
  const body = (await response.json()) as {
    output?: Array<{
      content?: Array<{
        text?: string;
        annotations?: Array<{ url?: string; title?: string }>;
      }>;
    }>;
  };
  const hits: ResearchHit[] = [];
  const seen = new Set<string>();
  for (const output of body.output || []) {
    for (const content of output.content || []) {
      for (const annotation of content.annotations || []) {
        const url = annotation.url?.trim();
        if (!url || seen.has(url)) continue;
        seen.add(url);
        hits.push({
          title: annotation.title,
          url,
          description: content.text?.slice(0, 500),
          provider: 'openai-web-search',
        });
      }
    }
  }
  return hits.slice(0, 16);
}

async function fetchResearchPage(url: string): Promise<ResearchPage | null> {
  try {
    const page = await scrapeUrl(url);
    const imageUrls: string[] = [];
    // Markdown/og may not include imgs; scrapeUrl fallback may be text-only.
    return {
      url: page.url,
      title: page.title,
      description: page.description,
      text: page.markdown.slice(0, 10_000),
      imageUrls,
      provider: page.source,
    };
  } catch {
    return null;
  }
}

export function createDefaultResearchAdapter(): ResearchProviderAdapter {
  const configured = Boolean(process.env.OPENAI_API_KEY?.trim());
  return {
    id: 'ea-openai-web-search',
    configured,
    search: openAiWebSearch,
    fetchPage: fetchResearchPage,
  };
}

export async function multiQueryResearch(
  adapter: ResearchProviderAdapter,
  queries: string[],
): Promise<{ hits: ResearchHit[]; pages: ResearchPage[]; warnings: string[] }> {
  const warnings: string[] = [];
  if (!adapter.configured) {
    warnings.push(
      `Research adapter ${adapter.id} is not configured — cannot fabricate research.`,
    );
    return { hits: [], pages: [], warnings };
  }

  const hits: ResearchHit[] = [];
  const seen = new Set<string>();
  for (const query of queries.slice(0, 5)) {
    try {
      const batch = await adapter.search(query);
      for (const hit of batch) {
        if (seen.has(hit.url)) continue;
        seen.add(hit.url);
        hits.push(hit);
      }
    } catch (err) {
      warnings.push(
        `Search failed for "${query.slice(0, 60)}": ${err instanceof Error ? err.message : 'error'}`,
      );
    }
  }

  const pages: ResearchPage[] = [];
  const fetchPage = adapter.fetchPage || fetchResearchPage;
  for (const hit of hits.slice(0, 8)) {
    const page = await fetchPage(hit.url);
    if (page) pages.push(page);
  }

  return { hits, pages, warnings };
}
