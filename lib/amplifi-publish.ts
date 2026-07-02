import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export type AmplifiPublishInput = {
  slug: string;
  title: string;
  message: string;
  caption?: string;
  storyUrl?: string;
  actorName: string;
};

export type AmplifiPublishResult = {
  ok: boolean;
  mode: 'webhook' | 'manual';
  detail: string;
  shareUrls?: {
    x: string;
    facebook: string;
    linkedin: string;
    amplifi: string;
  };
};

function buildCaption(input: AmplifiPublishInput): string {
  if (input.caption?.trim()) return input.caption.trim();
  const story = input.storyUrl?.trim();
  if (story) return `${input.title}\n\n${input.message}\n\n${story}`;
  return `${input.title}\n\n${input.message}`;
}

export async function publishToAmplifi(input: AmplifiPublishInput): Promise<AmplifiPublishResult> {
  const webhook = process.env.AMPLIFI_WEBHOOK_URL?.trim() || process.env.MAKE_AMPLIFI_WEBHOOK?.trim();
  const base = EA_PLATFORM_URL.replace(/\/$/, '');
  const storyUrl = input.storyUrl?.trim() || `${base}/amplifi`;
  const portalUrl = `${base}/portal/${input.slug}/amplifi`;
  const caption = buildCaption(input);
  const shareUrls = {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption.slice(0, 280))}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storyUrl)}&quote=${encodeURIComponent(caption)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(storyUrl)}`,
    amplifi: portalUrl,
  };

  if (!webhook) {
    return {
      ok: true,
      mode: 'manual',
      detail: 'Amplifi webhook not configured — use share links below for manual posting.',
      shareUrls,
    };
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'amplifi.publish',
        product: 'ea',
        slug: input.slug,
        title: input.title,
        message: input.message,
        caption,
        storyUrl,
        amplifiUrl: portalUrl,
        actorName: input.actorName,
        requestedAt: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => 'Webhook failed');
      return {
        ok: false,
        mode: 'webhook',
        detail: text || `Amplifi webhook returned ${res.status}`,
        shareUrls,
      };
    }
    return {
      ok: true,
      mode: 'webhook',
      detail: 'Queued for Amplifi social publishing.',
      shareUrls,
    };
  } catch (error) {
    return {
      ok: false,
      mode: 'webhook',
      detail: error instanceof Error ? error.message : 'Amplifi webhook failed',
      shareUrls,
    };
  }
}

export function isSocialPostRequest(requestType: string): boolean {
  return requestType.trim().toLowerCase() === 'social post';
}

export function parseSocialPostNotes(notes?: string): { captureId?: string; storyUrl?: string } {
  if (!notes?.trim()) return {};
  try {
    const parsed = JSON.parse(notes) as { captureId?: string; storyUrl?: string };
    return parsed;
  } catch {
    const captureMatch = notes.match(/captureId[=:]\s*(\S+)/i);
    const urlMatch = notes.match(/https?:\/\/\S+/);
    return {
      captureId: captureMatch?.[1],
      storyUrl: urlMatch?.[0],
    };
  }
}
