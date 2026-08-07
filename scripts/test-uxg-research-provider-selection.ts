/**
 * Provider selection + graceful off fallback.
 * Run: npx --yes tsx scripts/test-uxg-research-provider-selection.ts
 */
import assert from 'node:assert/strict';
import {
  resolveUxgResearchProviderId,
  selectUxgResearchProvider,
} from '../lib/uxg/research/select-provider';

async function main() {
  const prev = { ...process.env };

  try {
    delete process.env.UXG_RESEARCH_PROVIDER;
    delete process.env.UXG_RESEARCH_WORKER_URL;
    delete process.env.UXG_RESEARCH_WORKER_TOKEN;
    assert.equal(resolveUxgResearchProviderId(process.env), 'off');
    const off = selectUxgResearchProvider(process.env);
    assert.equal(off.id, 'off');
    assert.equal(off.configured, false);
    assert.equal(
      await off.crawl({
        subjectName: 'Test',
        knownUrls: [],
        candidateUrls: [],
        maxPages: 1,
        crawlDepth: 1,
        assetTypes: ['logo'],
      }),
      null,
    );

    process.env.UXG_RESEARCH_PROVIDER = 'crawl4ai';
    process.env.UXG_RESEARCH_WORKER_URL = 'http://127.0.0.1:8080';
    process.env.UXG_RESEARCH_WORKER_TOKEN = 'test-token';
    assert.equal(resolveUxgResearchProviderId(process.env), 'crawl4ai');
    const c4 = selectUxgResearchProvider(process.env);
    assert.equal(c4.id, 'crawl4ai');
    assert.equal(c4.configured, true);

    process.env.UXG_RESEARCH_PROVIDER = 'firecrawl';
    assert.equal(resolveUxgResearchProviderId(process.env), 'firecrawl');

    process.env.UXG_RESEARCH_PROVIDER = 'off';
    assert.equal(resolveUxgResearchProviderId(process.env), 'off');

    console.log(JSON.stringify({ ok: true }, null, 2));
  } finally {
    for (const key of Object.keys(process.env)) {
      if (!(key in prev)) delete process.env[key];
    }
    Object.assign(process.env, prev);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
