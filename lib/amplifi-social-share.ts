import type { AmplifiSocialDraft } from './amplifi-draft';

export type SocialPlatform = 'x' | 'facebook' | 'linkedin';

export function captionForPlatform(draft: AmplifiSocialDraft, platform: SocialPlatform): string {
  if (platform === 'x') {
    const tags = draft.hashtags.slice(0, 3).join(' ');
    return `${draft.shortCaption}${tags ? ` ${tags}` : ''}`.slice(0, 280);
  }
  if (platform === 'linkedin') return draft.linkedIn;
  return draft.shortCaption;
}

export function twitterShareUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function facebookShareUrl(pageUrl: string, quote?: string): string {
  const params = new URLSearchParams({ u: pageUrl });
  if (quote?.trim()) params.set('quote', quote.trim());
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

export function linkedInShareUrl(pageUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
}

export function openSocialShare(platform: SocialPlatform, draft: AmplifiSocialDraft, storyUrl: string): void {
  const text = captionForPlatform(draft, platform);
  const url =
    platform === 'x'
      ? twitterShareUrl(text)
      : platform === 'facebook'
        ? facebookShareUrl(storyUrl, text)
        : linkedInShareUrl(storyUrl);
  window.open(url, '_blank', 'noopener,noreferrer,width=600,height=720');
}
