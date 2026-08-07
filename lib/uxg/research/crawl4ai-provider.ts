import type { UxgResearchProvider } from '@/lib/uxg/research/provider';
import { getWorkerClientConfig, postCrawlJob } from '@/lib/uxg/research/client';
import type { ResearchCrawlRequest } from '@/lib/uxg/research/schemas';

export function createCrawl4AIResearchProvider(): UxgResearchProvider {
  const config = getWorkerClientConfig();
  return {
    id: 'crawl4ai',
    configured: Boolean(config),
    async crawl(request: ResearchCrawlRequest) {
      return postCrawlJob(request, config);
    },
  };
}
