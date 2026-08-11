import { createHash } from 'node:crypto';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export type AmplifiPublishInput = {
  slug: string;
  title: string;
  message: string;
  caption?: string;
  storyUrl?: string;
  actorName: string;
  idempotencyKey?: string;
  dryRun?: boolean;
  media?: {
    url: string;
    mimeType?: string;
    altText?: string;
    width?: number;
    height?: number;
  };
};

export type AmplifiPublishStatus = 'blocked' | 'queued' | 'published' | 'failed';

export type AmplifiPublishResult = {
  ok: boolean;
  mode: 'webhook' | 'manual';
  status: AmplifiPublishStatus;
  detail: string;
  attemptedAt: string;
  retryable: boolean;
  externalId?: string;
  idempotencyKey: string;
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

function buildIdempotencyKey(input: AmplifiPublishInput, caption: string): string {
  if (input.idempotencyKey?.trim()) return input.idempotencyKey.trim();
  return createHash('sha256')
    .update(['amplifi.publish', input.slug, input.title, caption, input.storyUrl ?? ''].join('|'))
    .digest('hex');
}

function readWebhookReceipt(value: unknown): {
  status?: AmplifiPublishStatus;
  externalId?: string;
  href?: string;
} {
  if (!value || typeof value !== 'object') return {};
  const row = value as Record<string, unknown>;
  const rawStatus = String(row.status ?? '').toLowerCase();
  const status: AmplifiPublishStatus | undefined =
    rawStatus === 'published' || rawStatus === 'queued' || rawStatus === 'failed' || rawStatus === 'blocked'
      ? rawStatus
      : undefined;
  const externalId = row.externalId ?? row.postId ?? row.id;
  return {
    status,
    externalId: typeof externalId === 'string' ? externalId : undefined,
    href: typeof row.href === 'string' ? row.href : undefined,
  };
}

export async function publishToAmplifi(input: AmplifiPublishInput): Promise<AmplifiPublishResult> {
  const webhook = process.env.AMPLIFI_WEBHOOK_URL?.trim() || process.env.MAKE_AMPLIFI_WEBHOOK?.trim();
  const base = EA_PLATFORM_URL.replace(/\/$/, '');
  const storyUrl = input.storyUrl?.trim() || `${base}/amplifi`;
  const portalUrl = `${base}/portal/${input.slug}/amplifi`;
  const caption = buildCaption(input);
  const idempotencyKey = buildIdempotencyKey(input, caption);
  const attemptedAt = new Date().toISOString();
  const shareUrls = {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption.slice(0, 280))}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storyUrl)}&quote=${encodeURIComponent(caption)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(storyUrl)}`,
    amplifi: portalUrl,
  };

  if (!webhook) {
    return {
      ok: false,
      mode: 'manual',
      status: 'blocked',
      detail: 'Social publishing is blocked until a publishing provider is connected. Manual share links remain available.',
      attemptedAt,
      retryable: false,
      idempotencyKey,
      shareUrls,
    };
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
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
        media: input.media,
        idempotencyKey,
        requestedAt: attemptedAt,
        dryRun: input.dryRun === true,
      }),
    });

    const raw = await res.text().catch(() => '');
    let receipt: ReturnType<typeof readWebhookReceipt> = {};
    if (raw) {
      try {
        receipt = readWebhookReceipt(JSON.parse(raw));
      } catch {
        receipt = {};
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        mode: 'webhook',
        status: 'failed',
        detail: raw || `Amplifi webhook returned ${res.status}`,
        attemptedAt,
        retryable: res.status === 408 || res.status === 429 || res.status >= 500,
        externalId: receipt.externalId,
        idempotencyKey,
        shareUrls,
      };
    }

    if (receipt.status === 'failed' || receipt.status === 'blocked') {
      return {
        ok: false,
        mode: 'webhook',
        status: receipt.status,
        detail: raw || `Publishing provider returned ${receipt.status}.`,
        attemptedAt,
        retryable: receipt.status === 'failed',
        externalId: receipt.externalId,
        idempotencyKey,
        shareUrls,
      };
    }

    const status = receipt.status === 'published' && receipt.externalId ? 'published' : 'queued';
    return {
      ok: true,
      mode: 'webhook',
      status,
      detail:
        status === 'published'
          ? 'Publishing provider confirmed the social post is live.'
          : 'Accepted by the publishing provider; live publication has not yet been confirmed.',
      attemptedAt,
      retryable: false,
      externalId: receipt.externalId,
      idempotencyKey,
      shareUrls: { ...shareUrls, ...(receipt.href ? { amplifi: receipt.href } : {}) },
    };
  } catch (error) {
    return {
      ok: false,
      mode: 'webhook',
      status: 'failed',
      detail: error instanceof Error ? error.message : 'Amplifi webhook failed',
      attemptedAt,
      retryable: true,
      idempotencyKey,
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
