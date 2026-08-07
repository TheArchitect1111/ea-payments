/**
 * FirecrawlResearchProvider — hosted alternative mapped into ResearchCrawlResult.
 * Shallower than Crawl4AI deep crawl; keeps Factory pipeline provider-agnostic.
 */
import { scrapeUrl } from '@/lib/firecrawl';
import type { UxgResearchProvider } from '@/lib/uxg/research/provider';
import {
  RESEARCH_CRAWL_SCHEMA_VERSION,
  type ResearchCrawlRequest,
  type ResearchCrawlResult,
  type BrandAsset,
  type MediaAssetCrawl,
  type ResearchEvidence,
} from '@/lib/uxg/research/schemas';

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function extractImages(markdown: string, pageUrl: string): MediaAssetCrawl[] {
  const urls = new Set<string>();
  const md = markdown.matchAll(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/g);
  for (const m of md) urls.add(m[1]!);
  const html = markdown.matchAll(/https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif|svg)/gi);
  for (const m of html) urls.add(m[0]!.replace(/[),.;]+$/, ''));
  return [...urls].slice(0, 20).map((originalUrl) => ({
    originalUrl,
    pageUrl,
    relevanceCategory: /logo/i.test(originalUrl) ? ('logo' as const) : ('other' as const),
    usageStatus: 'preview_only' as const,
    rejected: false,
  }));
}

function extractColors(text: string, sourceUrl: string): BrandAsset[] {
  const colors = new Set<string>();
  for (const m of text.matchAll(/#([0-9a-fA-F]{6})\b/g)) {
    colors.add(`#${m[1]!.toLowerCase()}`);
  }
  return [...colors].slice(0, 8).map((value) => ({
    kind: 'color' as const,
    value,
    sourceUrl,
    confidence: 0.35,
    consistentAcrossSources: false,
  }));
}

export function createFirecrawlResearchProvider(): UxgResearchProvider {
  const configured = Boolean(process.env.FIRECRAWL_API_KEY?.trim());
  return {
    id: 'firecrawl',
    configured,
    async crawl(request: ResearchCrawlRequest): Promise<ResearchCrawlResult | null> {
      const seeds = [...request.knownUrls, ...request.candidateUrls].slice(
        0,
        Math.min(request.maxPages, 8),
      );
      if (!seeds.length) return null;

      const startedAt = new Date().toISOString();
      const jobId = request.jobId || `fc-${Date.now()}`;
      const evidence: ResearchEvidence[] = [];
      const brandAssets: BrandAsset[] = [];
      const mediaAssets: MediaAssetCrawl[] = [];
      const domains = new Set<string>();
      const errors: Array<{ url?: string; code: string; message: string }> = [];
      let pagesFetched = 0;

      for (const url of seeds) {
        try {
          const page = await scrapeUrl(url);
          pagesFetched += 1;
          const host = hostOf(url);
          if (host) domains.add(host);
          const excerpt = page.markdown.slice(0, 400).replace(/\s+/g, ' ').trim();
          if (excerpt.length > 40) {
            evidence.push({
              claim: excerpt.slice(0, 220),
              category: 'other',
              sourceUrl: url,
              pageTitle: page.title,
              excerpt,
              retrievedAt: startedAt,
              confidence: page.source === 'firecrawl' ? 0.7 : 0.45,
              independentlyCorroborated: false,
            });
          }
          brandAssets.push(...extractColors(page.markdown, url));
          if (page.metadata?.ogImage) {
            mediaAssets.push({
              originalUrl: page.metadata.ogImage,
              pageUrl: url,
              relevanceCategory: 'other',
              usageStatus: 'preview_only',
              rejected: false,
            });
            brandAssets.push({
              kind: 'og_image',
              value: page.metadata.ogImage,
              sourceUrl: url,
              confidence: 0.7,
              consistentAcrossSources: false,
            });
          }
          mediaAssets.push(...extractImages(page.markdown, url));
        } catch (err) {
          errors.push({
            url,
            code: 'scrape_failed',
            message: err instanceof Error ? err.message : 'scrape failed',
          });
        }
      }

      const finishedAt = new Date().toISOString();
      return {
        schemaVersion: 1,
        identity: {
          canonicalName: request.subjectName,
          entityType: 'unknown',
          geography: [],
          officialDomains: [...domains].slice(0, 5),
          socialProfiles: [],
          identityVerified: false,
          identityStatus: 'incomplete',
          employerAffiliated: false,
          rejectedDomains: [],
        },
        evidence,
        organization: {
          services: [],
          audiences: [],
          history: [],
          locations: [],
          leadership: [],
          contactPaths: [],
          callsToAction: [],
        },
        brandAssets,
        mediaAssets,
        documents: [],
        diagnostics: {
          pagesFetched,
          pagesFailed: errors.length,
          retries: 0,
          durationMs: Date.parse(finishedAt) - Date.parse(startedAt),
          errors,
          provider: 'firecrawl',
        },
        job: {
          jobId,
          status: pagesFetched > 0 ? (errors.length ? 'partial' : 'succeeded') : 'failed',
          startedAt,
          finishedAt,
          attempt: 1,
        },
      };
    },
  };
}
