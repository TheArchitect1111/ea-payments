/** After Simplifi capture: Magnifi is built automatically; Amplifi = share the story. */
export interface CaptureSuccessLinks {
  magnifiUrl?: string;
  considerUrl?: string;
  guidanceUrl?: string;
  workspaceUrl?: string;
  clientMessage?: string;
}

export function capturePipelineSteps() {
  return [
    { step: 'Simplifi', detail: 'Capture & score the opportunity' },
    { step: 'Magnifi', detail: 'Cinematic story — built automatically' },
    { step: 'Amplifi', detail: 'Share the Consider link with anyone' },
  ] as const;
}

/** Open Magnifi in a new tab; returns false if pop-up blocked. */
export function openMagnifiExperience(magnifiUrl: string): boolean {
  if (typeof window === 'undefined') return false;
  const win = window.open(magnifiUrl, '_blank', 'noopener,noreferrer');
  return win != null;
}

export async function shareAmplifiLink(considerUrl: string, title?: string): Promise<'shared' | 'copied'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: title ?? 'Amplifi™', text: title, url: considerUrl });
      return 'shared';
    } catch {
      /* cancelled */
    }
  }
  await navigator.clipboard.writeText(considerUrl);
  return 'copied';
}
