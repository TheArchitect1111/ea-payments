/**
 * UxgResearchProvider — deep crawl interface (Crawl4AI / Firecrawl).
 * Distinct from factory-research ResearchProvider (artifact collectors).
 */
import type { ResearchCrawlRequest, ResearchCrawlResult } from '@/lib/uxg/research/schemas';

export type UxgResearchProviderId = 'crawl4ai' | 'firecrawl' | 'off';

export type UxgResearchProvider = {
  id: UxgResearchProviderId;
  configured: boolean;
  crawl(request: ResearchCrawlRequest): Promise<ResearchCrawlResult | null>;
};
