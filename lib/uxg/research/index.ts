/**
 * UXG research public exports.
 */
export {
  RESEARCH_CRAWL_SCHEMA_VERSION,
  parseResearchCrawlRequest,
  parseResearchCrawlResult,
  safeParseResearchCrawlResult,
  scoreResearchCrawlCompleteness,
  ResearchCrawlRequestSchema,
  ResearchCrawlResultSchema,
  type ResearchCrawlRequest,
  type ResearchCrawlResult,
  type BrandProfile,
  type MediaAssetCrawl,
} from '@/lib/uxg/research/schemas';
export type { UxgResearchProvider, UxgResearchProviderId } from '@/lib/uxg/research/provider';
export { selectUxgResearchProvider, resolveUxgResearchProviderId } from '@/lib/uxg/research/select-provider';
export { createCrawl4AIResearchProvider } from '@/lib/uxg/research/crawl4ai-provider';
export { createFirecrawlResearchProvider } from '@/lib/uxg/research/firecrawl-provider';
export { runUxgResearchPipeline, UXG_RESEARCH_PIPELINE_WORKER } from '@/lib/uxg/research/pipeline';
export {
  resolveIdentityCandidates,
  domainAgreesWithSubject,
  normalizeUrl,
  hostOf,
} from '@/lib/uxg/research/identity-resolve';
export type { IdentityResolution, RejectedDomain } from '@/lib/uxg/research/identity-resolve';
export { materializeDurableMedia, assertsNoHotlink } from '@/lib/uxg/research/durable-assets';
export {
  mapCrawlToKnowledgePack,
  mapCrawlToMediaBrandPack,
  buildBrandProfile,
} from '@/lib/uxg/research/map-to-packs';
