export type PremiumCampaignPost = {
  title: string;
  caption: string;
  callToAction: string;
  imageDirection: string;
  imageUrl?: string;
};

export type AmplifiCarouselSlide = {
  index: number;
  role: 'hook' | 'problem' | 'proof' | 'clarity' | 'action';
  headline: string;
  copy: string;
  imageUrl: string;
};

export type AmplifiVideoScene = {
  index: number;
  startSecond: number;
  durationSeconds: number;
  headline: string;
  onScreenCopy: string;
  visualDirection: string;
  imageUrl: string;
};

const ROLES: AmplifiCarouselSlide['role'][] = ['hook', 'problem', 'proof', 'clarity', 'action'];
const LAYOUTS = ['editorial-hero', 'editorial-split', 'story-proof', 'promotion-offer', 'editorial-hero'];

function creativeImageUrl(post: PremiumCampaignPost, index: number, format: 'carousel' | 'story') {
  const params = new URLSearchParams({
    title: post.title,
    subhead: post.caption.slice(0, 150),
    objective: index === 4 ? post.callToAction : ROLES[index] || 'campaign',
    cta: index === 4 ? post.callToAction : '',
    brand: 'Amplifi Campaign',
    layout: LAYOUTS[index] || 'editorial-hero',
    format,
    v: '5',
  });
  return `/api/amplifi/post-image?${params.toString()}`;
}

export function buildAmplifiCarousel(posts: PremiumCampaignPost[]): AmplifiCarouselSlide[] {
  return posts.slice(0, 5).map((post, index) => ({
    index: index + 1,
    role: ROLES[index] || 'clarity',
    headline: post.title,
    copy: post.caption,
    imageUrl: creativeImageUrl(post, index, 'carousel'),
  }));
}

export function buildAmplifiShortVideo(posts: PremiumCampaignPost[]) {
  const scenes: AmplifiVideoScene[] = posts.slice(0, 5).map((post, index) => ({
    index: index + 1,
    startSecond: index * 3,
    durationSeconds: 3,
    headline: post.title,
    onScreenCopy: index === 4 ? post.callToAction : post.caption.slice(0, 95),
    visualDirection: post.imageDirection,
    imageUrl: creativeImageUrl(post, index, 'story'),
  }));
  return {
    format: '9:16' as const,
    durationSeconds: scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0),
    scenes,
    renderEngine: 'remotion+ffmpeg',
    approvalRequired: true,
  };
}

export function scoreAmplifiPremiumPackage(posts: PremiumCampaignPost[]) {
  const five = posts.slice(0, 5);
  const complete = five.length === 5;
  const titleQuality = five.filter((p) => p.title.trim().length >= 8 && p.title.length <= 90).length / 5;
  const captionQuality = five.filter((p) => p.caption.trim().length >= 40 && p.caption.length <= 600).length / 5;
  const ctaQuality = five.filter((p) => p.callToAction.trim().length >= 2).length / 5;
  const visualQuality = five.filter((p) => p.imageDirection.trim().length >= 15).length / 5;
  const uniqueness = new Set(five.map((p) => p.title.toLowerCase().trim())).size / 5;
  const technical = complete ? 10 : Math.max(0, five.length * 2);
  const overall = Math.round((technical * .2 + titleQuality * 10 * .15 + captionQuality * 10 * .2 + ctaQuality * 10 * .15 + visualQuality * 10 * .15 + uniqueness * 10 * .15) * 100) / 100;
  const violations: string[] = [];
  if (!complete) violations.push('five-piece-campaign-required');
  if (titleQuality < 1) violations.push('headline-quality');
  if (captionQuality < .8) violations.push('caption-quality');
  if (ctaQuality < 1) violations.push('cta-missing');
  if (visualQuality < 1) violations.push('visual-direction-missing');
  if (uniqueness < 1) violations.push('duplicate-headlines');
  return { threshold: 8.5, overall, passed: overall >= 8.5 && violations.length === 0, violations, regenerateOnFailure: true };
}

export function buildAmplifiPremiumPackage(posts: PremiumCampaignPost[]) {
  return {
    graphics: posts.slice(0, 5).map((post, index) => ({ ...post, imageUrl: post.imageUrl || creativeImageUrl(post, index, 'carousel') })),
    carousel: buildAmplifiCarousel(posts),
    shortVideo: buildAmplifiShortVideo(posts),
    qa: scoreAmplifiPremiumPackage(posts),
  };
}
