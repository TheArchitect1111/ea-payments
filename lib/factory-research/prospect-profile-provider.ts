/**
 * Prospect Profile provider — name/context → ranked public identity evidence.
 * Uses Brave Search when configured and emits a safe incomplete profile otherwise.
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

async function braveSearch(query: string): Promise<SearchCandidate[]> {
  const key = process.env.BRAVE_SEARCH_API_KEY?.trim();
  if (!key) return [];
  const endpoint = new URL('https://api.search.brave.com/res/v1/web/search');
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('count', '12');
  endpoint.searchParams.set('safesearch', 'moderate');
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
      'X-Subscription-Token': key,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Brave Search failed with ${response.status}`);
  const body = (await response.json()) as {
    web?: { results?: Array<{ title?: string; url?: string; description?: string }> };
  };
  return (body.web?.results || [])
    .filter((item): item is { title?: string; url: string; description?: string } =>
      Boolean(item.url),
    )
    .map((item) => ({
      title: item.title,
      url: item.url,
      description: item.description,
    }));
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

let activeSearch: PublicSearch = braveSearch;

export function setProspectPublicSearch(search: PublicSearch | null) {
  activeSearch = search || braveSearch;
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
      const searchConfigured = Boolean(search || process.env.BRAVE_SEARCH_API_KEY?.trim());
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
