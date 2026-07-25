/** After Simplifi capture: Magnifi is built automatically; Amplifi = share the Magnifi story. */
export interface CaptureSuccessLinks {
  magnifiUrl?: string;
  considerUrl?: string;
  guidanceUrl?: string;
  workspaceUrl?: string;
  opportunityUrl?: string;
  clientMessage?: string;
}

export type CaptureSuccessInsight = {
  opportunityScore?: number;
  nextAction?: string;
  decisionPath?: string;
  decisionConfidence?: number;
  decisionRationale?: string;
};

export function capturePipelineSteps() {
  return [
    { step: 'Simplifi', detail: 'Capture & score the opportunity' },
    { step: 'Magnifi', detail: 'Cinematic story — built automatically' },
    { step: 'Amplifi', detail: 'Share the Magnifi link (anyone with it can view)' },
  ] as const;
}

/** Open Magnifi in a new tab; returns false if pop-up blocked. */
export function openMagnifiExperience(magnifiUrl: string): boolean {
  if (typeof window === 'undefined') return false;
  const win = window.open(magnifiUrl, '_blank', 'noopener,noreferrer');
  return win != null;
}

export async function shareAmplifiLink(storyUrl: string, title?: string): Promise<'shared' | 'copied'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: title ?? 'Amplifi™', text: title, url: storyUrl });
      return 'shared';
    } catch {
      /* cancelled */
    }
  }
  await navigator.clipboard.writeText(storyUrl);
  return 'copied';
}

export function formatDecisionPathLabel(path: string): string {
  return path
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
