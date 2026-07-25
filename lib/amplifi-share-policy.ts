import { EA_PLATFORM_URL, canonicalPlatformOrigin } from '@/lib/platform-urls';

/** V1 Magnifi access is public-by-link (session gate deferred). Show wherever clients share. */
export const MAGNIFI_PUBLIC_LINK_WARNING = 'Anyone with the link can view this story.';

export const MAGNIFI_PUBLIC_LINK_GUIDANCE =
  'Anyone with the link can view this story. Do not share sensitive captures — archive the capture to retire it from active lists and stop the public Magnifi page.';

type PreferMagnifiInput = {
  magnifiUrl?: string | null;
  considerUrl?: string | null;
  shareUrl?: string | null;
  captureId?: string | null;
};

/**
 * Amplifi share actions prefer the portal Magnifi story URL.
 * Consider / Share URL is fallback only when Magnifi is unavailable.
 */
export function preferPortalMagnifiUrl(input: PreferMagnifiInput): string | undefined {
  const magnifi = input.magnifiUrl?.trim();
  if (magnifi) return magnifi;

  const id = input.captureId?.trim();
  if (id) {
    if (id.startsWith('/magnifi/')) return id;
    return `/magnifi/${id}`;
  }

  return input.considerUrl?.trim() || input.shareUrl?.trim() || undefined;
}

/** Absolute URL for drafts, email, and native share sheets. */
export function absoluteAmplifiShareUrl(
  pathOrUrl: string,
  base: string = process.env.NEXT_PUBLIC_BASE_URL ?? EA_PLATFORM_URL,
): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const origin = canonicalPlatformOrigin(base);
  return trimmed.startsWith('/') ? `${origin}${trimmed}` : `${origin}/${trimmed}`;
}

export function isMagnifiCaptureRetired(status?: string | null): boolean {
  return (status ?? '').trim().toLowerCase() === 'archived';
}
