import type { UxgResearchProvider, UxgResearchProviderId } from '@/lib/uxg/research/provider';
import { createCrawl4AIResearchProvider } from '@/lib/uxg/research/crawl4ai-provider';
import { createFirecrawlResearchProvider } from '@/lib/uxg/research/firecrawl-provider';
import { getWorkerClientConfig } from '@/lib/uxg/research/client';

const OFF_PROVIDER: UxgResearchProvider = {
  id: 'off',
  configured: false,
  async crawl() {
    return null;
  },
};

export function resolveUxgResearchProviderId(
  env: NodeJS.ProcessEnv = process.env,
): UxgResearchProviderId {
  const raw = (env.UXG_RESEARCH_PROVIDER || '').trim().toLowerCase();
  if (raw === 'off' || raw === 'firecrawl' || raw === 'crawl4ai') return raw;
  // Default: crawl4ai when worker configured, else off (graceful fallback).
  if (getWorkerClientConfig()) return 'crawl4ai';
  return 'off';
}

export function selectUxgResearchProvider(
  env: NodeJS.ProcessEnv = process.env,
): UxgResearchProvider {
  const id = resolveUxgResearchProviderId(env);
  if (id === 'crawl4ai') return createCrawl4AIResearchProvider();
  if (id === 'firecrawl') return createFirecrawlResearchProvider();
  return OFF_PROVIDER;
}
