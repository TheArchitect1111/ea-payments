import assert from 'node:assert/strict';
import { postCrawlJob, type WorkerClientConfig } from '../lib/uxg/research/client';

const request = {
  subjectName: 'Brickey Botanicals',
  knownUrls: ['https://brickeybotanicals.com/'],
  candidateUrls: [],
  maxPages: 1,
  crawlDepth: 1,
  assetTypes: ['logo' as const, 'photo' as const],
  allowDomains: ['brickeybotanicals.com'],
  jobId: 'async-client-test',
};

const result = {
  schemaVersion: 1,
  identity: {
    canonicalName: 'Brickey Botanicals',
    entityType: 'organization',
    geography: [],
    officialDomains: ['brickeybotanicals.com'],
    socialProfiles: [],
  },
  evidence: [],
  organization: {},
  brandAssets: [],
  mediaAssets: [],
  documents: [],
  diagnostics: { pagesFetched: 1, pagesFailed: 0, retries: 0, durationMs: 20, errors: [] },
  job: {
    jobId: 'async-client-test',
    status: 'succeeded',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    attempt: 1,
  },
};

const config: WorkerClientConfig = {
  baseUrl: 'https://worker.test',
  token: 'test-token',
  timeoutMs: 2_000,
  pollIntervalMs: 1,
};

async function successCase() {
  let calls = 0;
  global.fetch = (async (url: string | URL | Request) => {
    calls += 1;
    if (String(url).endsWith('/v1/jobs')) {
      return Response.json(
        { jobId: 'async-client-test', status: 'queued', statusUrl: '/v1/jobs/async-client-test' },
        { status: 202 },
      );
    }
    if (calls === 2) {
      return new Response('temporary upstream failure', { status: 502 });
    }
    if (calls === 3) {
      return Response.json({ jobId: 'async-client-test', status: 'running', stages: [] });
    }
    return Response.json({
      jobId: 'async-client-test',
      status: 'succeeded',
      stages: [{ name: 'crawling', status: 'succeeded', durationMs: 19 }],
      result,
    });
  }) as typeof fetch;
  const completed = await postCrawlJob(request, config);
  assert.ok(completed);
  assert.equal(completed.job.status, 'succeeded');
  assert.equal(completed.job.stages?.[0]?.name, 'crawling');
  assert.equal(calls, 4);
}

async function timeoutCase() {
  global.fetch = (async (url: string | URL | Request) => {
    if (String(url).endsWith('/v1/jobs')) {
      return Response.json(
        { jobId: 'timeout-test', status: 'queued', statusUrl: '/v1/jobs/timeout-test' },
        { status: 202 },
      );
    }
    return Response.json({ jobId: 'timeout-test', status: 'running', stages: [] });
  }) as typeof fetch;
  const timedOut = await postCrawlJob(
    { ...request, jobId: 'timeout-test' },
    { ...config, timeoutMs: 30, pollIntervalMs: 5 },
  );
  assert.equal(timedOut, null);
}

async function main() {
  await successCase();
  await timeoutCase();
  console.log(JSON.stringify({ ok: true, cases: ['poll-to-success', 'poll-timeout'] }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
