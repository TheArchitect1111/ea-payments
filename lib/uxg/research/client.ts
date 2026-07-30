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
};

export function getWorkerClientConfig(): WorkerClientConfig | null {
  const baseUrl = (process.env.UXG_RESEARCH_WORKER_URL || '').trim().replace(/\/$/, '');
  const token = (process.env.UXG_RESEARCH_WORKER_TOKEN || '').trim();
  if (!baseUrl || !token) return null;
  const timeoutMs = Number(process.env.UXG_RESEARCH_JOB_TIMEOUT_MS || 180_000);
  return {
    baseUrl,
    token,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 5_000 ? timeoutMs : 180_000,
  };
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
  try {
    const res = await fetch(`${config.baseUrl}/v1/crawl`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.timeoutMs),
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
    const json: unknown = await res.json();
    return parseResearchCrawlResult(json);
  } catch (err) {
    console.warn('[uxg-research] crawl request error', {
      error: err instanceof Error ? err.message : 'error',
    });
    return null;
  }
}
