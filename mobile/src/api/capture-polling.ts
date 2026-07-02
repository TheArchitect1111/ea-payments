import { fetchCaptureStatus, type CaptureStatusResponse } from './client';

export async function pollCaptureUntilReady(
  token: string,
  captureId: string,
  onTick?: (response: CaptureStatusResponse) => void,
  maxAttempts = 45,
  intervalMs = 2000,
): Promise<CaptureStatusResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetchCaptureStatus(token, captureId);
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

  throw new Error('Analysis is taking longer than expected. Check Workspace for your capture.');
}
