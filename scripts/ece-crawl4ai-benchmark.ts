/**
 * Crawl4AI architecture gate — sidecar adopted; Vercel must remain free of Crawl4AI.
 * Run: npx --yes tsx scripts/ece-crawl4ai-benchmark.ts
 */
console.log(
  JSON.stringify(
    {
      decision: 'ADOPT_CRAWL4AI_SIDECAR',
      rationale:
        'Deep crawl runs in services/uxg-research-worker (Docker). Next.js uses UxgResearchProvider + authenticated client. Firecrawl remains optional hosted alternative. No Python/Chromium in Vercel NFT.',
      vercelBundlesCrawl4ai: false,
      providerEnv: 'UXG_RESEARCH_PROVIDER',
      workerUrlEnv: 'UXG_RESEARCH_WORKER_URL',
    },
    null,
    2,
  ),
);
