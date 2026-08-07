/**
 * Authenticated HTTP client for the UXG Crawl4AI research worker.
 * Never bundles Python/Chromium — remote sidecar only.
 */
import {
  parseResearchCrawlRequest,
  parseResearchCrawlResult,
  type ResearchCrawlRequest,
  type ResearchCrawlResult,
} from '@/lib/uxg/research/schemas';

export type WorkerClientConfig = {
  baseUrl: string;
  token: string;
  timeoutMs: number;
  pollIntervalMs: number;
};

export function getWorkerClientConfig(): WorkerClientConfig | null {
  const baseUrl = (process.env.UXG_RESEARCH_WORKER_URL || '').trim().replace(/\/$/, '');
  const token = (process.env.UXG_RESEARCH_WORKER_TOKEN || '').trim();
  if (!baseUrl || !token) return null;
  const timeoutMs = Number(process.env.UXG_RESEARCH_JOB_TIMEOUT_MS || 180_000);
  const pollIntervalMs = Number(process.env.UXG_RESEARCH_POLL_INTERVAL_MS || 2_000);
  return {
    baseUrl,
    token,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 5_000 ? timeoutMs : 180_000,
    pollIntervalMs:
      Number.isFinite(pollIntervalMs) && pollIntervalMs >= 250 ? pollIntervalMs : 2_000,
  };
}

type WorkerJobAccepted = { jobId: string; status: 'queued'; statusUrl: string };
type WorkerJobSnapshot = {
  jobId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'partial';
  stages?: Array<{
    name: string;
    status: 'pending' | 'running' | 'succeeded' | 'failed';
    startedAt?: string;
    finishedAt?: string;
    durationMs?: number;
    detail?: string;
  }>;
  result?: unknown;
  error?: string;
};

function authHeaders(config: WorkerClientConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${config.token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function workerHealthCheck(
  config: WorkerClientConfig = getWorkerClientConfig()!,
): Promise<boolean> {
  if (!config?.baseUrl) return false;
  try {
    const res = await fetch(`${config.baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(8_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function postCrawlJob(
  request: ResearchCrawlRequest,
  config: WorkerClientConfig | null = getWorkerClientConfig(),
): Promise<ResearchCrawlResult | null> {
  if (!config) return null;
  const body = parseResearchCrawlRequest(request);
  const started = Date.now();
  try {
    const res = await fetch(`${config.baseUrl}/v1/jobs`, {
      method: 'POST',
      headers: authHeaders(config),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(Math.min(config.timeoutMs, 15_000)),
    });
    if (res.status === 401 || res.status === 403) {
      console.error('[uxg-research] worker auth failed', { status: res.status });
      return null;
    }
    if (res.status === 503 || res.status === 502) {
      console.warn('[uxg-research] worker unavailable', { status: res.status });
      return null;
    }
    if (!res.ok) {
      console.error('[uxg-research] crawl failed', {
        status: res.status,
        body: (await res.text()).slice(0, 400),
      });
      return null;
    }
    const accepted = (await res.json()) as WorkerJobAccepted;
    if (!accepted.jobId || !accepted.statusUrl) {
      console.error('[uxg-research] worker returned invalid job acceptance');
      return null;
    }

    const statusUrl = accepted.statusUrl.startsWith('http')
      ? accepted.statusUrl
      : `${config.baseUrl}${accepted.statusUrl}`;
    let transientPollFailures = 0;
    while (Date.now() - started < config.timeoutMs) {
      const remaining = config.timeoutMs - (Date.now() - started);
      let poll: Response;
      try {
        poll = await fetch(statusUrl, {
          method: 'GET',
          headers: authHeaders(config),
          signal: AbortSignal.timeout(Math.max(1_000, Math.min(10_000, remaining))),
        });
      } catch (error) {
        transientPollFailures += 1;
        console.warn('[uxg-research] transient job poll error', {
          jobId: accepted.jobId,
          attempt: transientPollFailures,
          error: error instanceof Error ? error.message : 'network error',
        });
        await delay(Math.min(config.pollIntervalMs, Math.max(0, remaining)));
        continue;
      }
      if ([502, 503, 504].includes(poll.status)) {
        transientPollFailures += 1;
        console.warn('[uxg-research] transient job status failure', {
          status: poll.status,
          jobId: accepted.jobId,
          attempt: transientPollFailures,
        });
        await delay(Math.min(config.pollIntervalMs, Math.max(0, remaining)));
        continue;
      }
      if (!poll.ok) {
        console.error('[uxg-research] job status failed', { status: poll.status, jobId: accepted.jobId });
        return null;
      }
      const snapshot = (await poll.json()) as WorkerJobSnapshot;
      transientPollFailures = 0;
      if (snapshot.status === 'succeeded' || snapshot.status === 'partial') {
        const parsed = parseResearchCrawlResult(snapshot.result);
        return {
          ...parsed,
          job: { ...parsed.job, stages: snapshot.stages || parsed.job.stages || [] },
        };
      }
      if (snapshot.status === 'failed') {
        console.error('[uxg-research] job failed', { jobId: accepted.jobId, error: snapshot.error || 'failed' });
        return null;
      }
      await delay(Math.min(config.pollIntervalMs, Math.max(0, remaining)));
    }
    console.warn('[uxg-research] job polling timed out', { jobId: accepted.jobId, timeoutMs: config.timeoutMs });
    return null;
  } catch (err) {
    console.warn('[uxg-research] crawl request error', {
      error: err instanceof Error ? err.message : 'error',
    });
    return null;
  }
}
