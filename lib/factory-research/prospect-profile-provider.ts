/**
 * Prospect Profile provider — name/context → ranked public identity evidence.
 * Uses the existing EA OpenAI Responses API web-search capability and emits a
 * safe incomplete profile when the shared AI gateway credential is unavailable.
 */
import { provenanceFromContext, type ArtifactDraft } from '@/lib/factory-artifact';
import { resolveResearchUrl } from '@/lib/factory-research/providers.mjs';
import { buildProspectProfileData } from '@/lib/factory-research/prospect-profile.mjs';
import {
  extractMetaContent,
  extractPageSignals,
} from '@/lib/factory-research/website-extract.mjs';
import type { ResearchProvider } from '@/lib/factory-research/types';
import type { ProjectContext } from '@/lib/factory-project-context';

type SearchCandidate = {
  title?: string;
  url: string;
  description?: string;
};

type ProspectProfileData = Record<string, unknown> & {
  identity: {
    status: string;
    confidence: number;
    selectedUrl: string | null;
    reason: string;
  };
  coverage: {
    citationCount: number;
  };
  searchError?: string;
};

export type PublicSearch = (query: string) => Promise<SearchCandidate[]>;

const MAX_PROFILE_PAGES = 5;
const MAX_HTML_BYTES = 512_000;

type ResponsesPayload = {
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: Array<{ url?: string; title?: string }>;
    }>;
  }>;
};

async function openAiWebSearch(query: string): Promise<SearchCandidate[]> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return [];
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.FACTORY_RESEARCH_MODEL?.trim() || 'gpt-5.6',
      tools: [{ type: 'web_search' }],
      input: [
        'Find the correct public identity for this prospect.',
        'Search for official websites, public professional profiles, interviews, press, events, and media.',
        'Do not infer private facts. Do not treat another person with the same name as a match.',
        'Answer briefly and cite every public source used.',
        `Prospect query: ${query}`,
      ].join('\n'),
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`OpenAI web search failed with ${response.status}`);
  const body = (await response.json()) as ResponsesPayload;
  const candidates: SearchCandidate[] = [];
  const seen = new Set<string>();
  for (const output of body.output || []) {
    for (const content of output.content || []) {
      for (const annotation of content.annotations || []) {
        const url = annotation.url?.trim();
        if (!url || seen.has(url)) continue;
        seen.add(url);
        candidates.push({
          title: annotation.title,
          url,
          description: content.text?.slice(0, 700),
        });
      }
    }
  }
  return candidates.slice(0, 12);
}

async function fetchPublicPage(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'EA-Factory-Research/1.0 (+https://efficiencyarchitects.online)',
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(12_000),
  });
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return null;
  const buffer = await response.arrayBuffer();
  const slice = buffer.byteLength > MAX_HTML_BYTES ? buffer.slice(0, MAX_HTML_BYTES) : buffer;
  const html = new TextDecoder('utf-8', { fatal: false }).decode(slice);
  const signals = extractPageSignals(html, response.url || url);
  const imageUrls = [...html.matchAll(/<img\b[^>]+src=["']([^"']+)["']/gi)]
    .map((match) => {
      try {
        return new URL(match[1], response.url || url).href;
      } catch {
        return null;
      }
    })
    .filter((value): value is string => Boolean(value))
    .slice(0, 12);
  const ogImage = extractMetaContent(html, 'og:image');
  return {
    ...signals,
    ogImage: ogImage
      ? (() => {
          try {
            return new URL(ogImage, response.url || url).href;
          } catch {
            return ogImage;
          }
        })()
      : null,
    imageUrls,
  };
}

let activeSearch: PublicSearch = openAiWebSearch;

export function setProspectPublicSearch(search: PublicSearch | null) {
  activeSearch = search || openAiWebSearch;
}

function prospectContext(context: ProjectContext) {
  return [context.seed.notes, context.seed.goal, context.seed.industry]
    .filter(Boolean)
    .join(' · ')
    .slice(0, 800);
}

export function createProspectProfileProvider(search?: PublicSearch): ResearchProvider {
  const runSearch = search || ((query: string) => activeSearch(query));
  return {
    id: 'prospect-profile',
    canCollect() {
      return true;
    },
    async collect(context: ProjectContext): Promise<ArtifactDraft[]> {
      const name = context.seed.client.trim();
      const knownUrl = resolveResearchUrl(context);
      const detail = prospectContext(context);
      const searchConfigured = Boolean(search || process.env.OPENAI_API_KEY?.trim());
      const query = [name, context.seed.industry, detail].filter(Boolean).join(' ').slice(0, 500);

      let candidates: SearchCandidate[] = [];
      let searchError: string | null = null;
      if (searchConfigured) {
        try {
          candidates = await runSearch(query);
        } catch (error) {
          searchError = error instanceof Error ? error.message : 'Public search failed';
        }
      }
      if (knownUrl && !candidates.some((candidate) => candidate.url === knownUrl)) {
        candidates.unshift({
          title: name,
          url: knownUrl,
          description: detail || 'Website supplied with the factory launch.',
        });
      }

      const pages = [];
      for (const candidate of candidates.slice(0, MAX_PROFILE_PAGES)) {
        try {
          const page = await fetchPublicPage(candidate.url);
          if (page) pages.push(page);
        } catch {
          // Search evidence remains useful when a result blocks direct collection.
        }
      }

      const data = buildProspectProfileData({
        name,
        knownUrl,
        context: detail,
        industry: context.seed.industry,
        candidates,
        pages,
        searchConfigured,
      }) as ProspectProfileData;
      if (searchError) {
        data.searchError = searchError;
        data.identity =
          data.identity.status === 'resolved'
            ? data.identity
            : {
                ...data.identity,
                status: 'search_failed',
                reason: searchError,
              };
      }

      return [{
        kind: 'prospect_profile',
        providerId: 'prospect-profile',
        provenance: provenanceFromContext(context, 'public_web_search', {
          sourceName: name,
          sourceUrl: data.identity.selectedUrl || knownUrl || undefined,
          notes: searchError || `identity=${data.identity.status};citations=${data.coverage.citationCount}`,
        }),
        data,
      }];
    },
  };
}

export const prospectProfileProvider = createProspectProfileProvider();
