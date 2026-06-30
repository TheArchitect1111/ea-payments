/**
 * Thin API client for Simplifi workspace + capture actions.
 * Shared by web workspace, PWA capture, and future Expo shell.
 */

export type SimplifiApiResult<T = Record<string, unknown>> = T & {
  ok?: boolean;
  error?: string;
};

async function simplifiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<SimplifiApiResult<T>> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json()) as SimplifiApiResult<T>;
  if (!res.ok && !data.error) {
    return { ...data, ok: false, error: `Request failed (${res.status})` };
  }
  return data;
}

export async function archiveCapture(recordId: string): Promise<SimplifiApiResult> {
  return simplifiFetch('/api/portal/opportunities/manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'archive', recordId }),
  });
}

export async function recordCaptureOutcome(
  recordId: string,
  outcome: 'won' | 'lost' | 'passed' | 'in_progress',
): Promise<SimplifiApiResult<{ outcomeStatus?: string }>> {
  return simplifiFetch('/api/portal/captures/outcome', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordId, outcome }),
  });
}

export async function snoozeCapture(
  recordId: string,
  days = 30,
): Promise<SimplifiApiResult<{ dueDate?: string }>> {
  return simplifiFetch('/api/portal/captures/outcome', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordId, action: 'snooze', days }),
  });
}

export async function fetchCaptureIntelligence(recordId: string): Promise<
  SimplifiApiResult<{
    intelligence?: {
      decision: { recommendedPath: string; confidenceScore: number };
      build: { buildPath: string; overlayConfidence: { overall: string } };
    };
  }>
> {
  return simplifiFetch(`/api/portal/captures/${encodeURIComponent(recordId)}/intelligence`);
}

export async function analyzeCaptureUrl(body: {
  url: string;
  prospectName?: string;
  notes?: string;
}): Promise<SimplifiApiResult> {
  return simplifiFetch('/api/portal/captures/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function analyzeCaptureForm(form: FormData): Promise<SimplifiApiResult> {
  const res = await fetch('/api/portal/captures/analyze', { method: 'POST', body: form });
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return { ok: false, error: res.status === 413 ? 'File too large.' : `Upload failed (${res.status}).` };
  }
  return res.json() as Promise<SimplifiApiResult>;
}

export async function fetchSimplifiWorkspace(): Promise<
  SimplifiApiResult<{
    slug: string;
    workspace: Record<string, unknown>;
  }>
> {
  return simplifiFetch('/api/simplifi/workspace');
}
