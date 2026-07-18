/**
 * Website research provider — fetches public HTML + light same-origin crawl.
 */
import { provenanceFromContext, type ArtifactDraft } from '@/lib/factory-artifact';
import {
  providerCanCollect,
  resolveResearchUrl,
} from '@/lib/factory-research/providers.mjs';
import {
  buildWebsiteArtifactData,
  selectCrawlCandidateUrls,
} from '@/lib/factory-research/website-extract.mjs';
import type { ResearchProvider } from '@/lib/factory-research/types';
import type { ProjectContext } from '@/lib/factory-project-context';

export type WebsiteFetchResult = {
  status: number;
  contentType: string | null;
  html: string;
};

export type WebsiteFetcher = (url: string) => Promise<WebsiteFetchResult>;

const MAX_HTML_BYTES = 512_000;
const MAX_CRAWL_PAGES = 3;

async function defaultFetchWebsite(url: string): Promise<WebsiteFetchResult> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'EA-Factory-Research/1.0 (+https://efficiencyarchitects.online)',
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(12_000),
  });

  const contentType = res.headers.get('content-type');
  const buffer = await res.arrayBuffer();
  const slice = buffer.byteLength > MAX_HTML_BYTES ? buffer.slice(0, MAX_HTML_BYTES) : buffer;
  const html = new TextDecoder('utf-8', { fatal: false }).decode(slice);

  return {
    status: res.status,
    contentType,
    html,
  };
}

let activeFetcher: WebsiteFetcher = defaultFetchWebsite;

/** Test seam — inject a mock fetcher. */
export function setWebsiteFetcher(fetcher: WebsiteFetcher | null) {
  activeFetcher = fetcher || defaultFetchWebsite;
}

async function crawlRelatedPages(
  run: WebsiteFetcher,
  homeUrl: string,
  homeHtml: string,
): Promise<Array<{ url: string; html: string }>> {
  const candidates = selectCrawlCandidateUrls(homeHtml, homeUrl, MAX_CRAWL_PAGES);
  if (!candidates.length) return [];

  const pages: Array<{ url: string; html: string }> = [];
  for (const candidate of candidates) {
    try {
      const page = await run(candidate);
      if (page.status >= 200 && page.status < 400 && page.html) {
        pages.push({ url: candidate, html: page.html });
      }
    } catch (err) {
      console.warn('[factory-research:website] crawl page failed', {
        url: candidate,
        error: err instanceof Error ? err.message : 'fetch failed',
      });
    }
  }
  return pages;
}

export function createWebsiteProvider(fetcher?: WebsiteFetcher): ResearchProvider {
  const run = fetcher ?? ((url: string) => activeFetcher(url));

  return {
    id: 'website',
    canCollect(context) {
      return providerCanCollect('website', context);
    },
    async collect(context: ProjectContext): Promise<ArtifactDraft[]> {
      const url = resolveResearchUrl(context);
      if (!url) return [];

      console.info('[factory-research:website] collect start', {
        projectId: context.projectId,
        url,
      });

      let data: Record<string, unknown>;
      try {
        const page = await run(url);
        const extraPages = await crawlRelatedPages(run, url, page.html);
        data = buildWebsiteArtifactData({
          url,
          status: page.status,
          contentType: page.contentType,
          html: page.html,
          extraPages,
        });
        console.info('[factory-research:website] collect ok', {
          projectId: context.projectId,
          url,
          httpStatus: page.status,
          title: (data.extracted as { title?: string } | null)?.title || null,
          relatedPages: extraPages.length,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Website fetch failed';
        console.error('[factory-research:website] collect failed', {
          projectId: context.projectId,
          url,
          error: message,
        });
        data = buildWebsiteArtifactData({
          url,
          status: 0,
          contentType: null,
          html: '',
          fetchError: message,
        });
      }

      return [
        {
          kind: 'website',
          providerId: 'website',
          provenance: provenanceFromContext(context, 'website', {
            sourceUrl: url,
            sourceName: context.seed.client,
            notes: data.ok === false ? String(data.error || 'fetch failed') : undefined,
          }),
          data,
        },
      ];
    },
  };
}

export const websiteProvider: ResearchProvider = createWebsiteProvider();
