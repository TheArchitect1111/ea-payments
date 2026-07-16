import type { CaptureApiResponse } from './capture-response';

export async function fetchCaptureStatus(captureId: string): Promise<CaptureApiResponse> {
  const res = await fetch(`/api/capture/${captureId}/status`, { cache: 'no-store' });
  return (await res.json()) as CaptureApiResponse;
}

export async function pollCaptureUntilReady(
  captureId: string,
  onTick?: (response: CaptureApiResponse) => void,
  maxAttempts = 45,
  intervalMs = 2000,
): Promise<CaptureApiResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetchCaptureStatus(captureId);
    onTick?.(response);

    if (!response.ok) {
      throw new Error(response.error ?? 'Capture status check failed.');
    }

    if (response.ready || response.status === 'Triaged' || response.status === 'Routed') {
      return response;
    }

    if (response.status === 'Captured' && !response.processing) {
      throw new Error('Capture analysis did not complete.');
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    'Analysis is taking longer than expected. Open your Simplifi workspace — your capture is still processing there.',
  );
}
