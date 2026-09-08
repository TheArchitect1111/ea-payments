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
const DEFAULT_VISUALS = [
  'Premium editorial hero composition with one dominant focal point and restrained typography.',
  'Emotion-led split composition that makes the audience problem immediately recognizable.',
  'Proof-focused editorial composition with strong hierarchy and visual credibility.',
  'Clean promotional composition with clear benefit hierarchy and an unmistakable next step.',
  'Decisive closing composition with generous negative space and a focused call to action.',
];

function creativeImageUrl(post: PremiumCampaignPost, index: number, format: 'carousel' | 'story') {
  const params = new URLSearchParams({
    title: post.title,
    subhead: post.caption.slice(0, 150),
    objective: index === 4 ? post.callToAction : ROLES[index] || 'campaign',
    cta: index === 4 ? post.callToAction : '',
    brand: 'Amplifi Campaign',
    layout: LAYOUTS[index] || 'editorial-hero',
    format,
    v: '6',
  });
  return `/api/amplifi/post-image?${params.toString()}`;
}

function normalizeSentence(value: string, fallback: string) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text || fallback;
}

export function repairAmplifiPremiumPosts(posts: PremiumCampaignPost[]) {
  return posts.slice(0, 5).map((post, index) => {
    let title = normalizeSentence(post.title, `Campaign idea ${index + 1}`).slice(0, 90);
    if (title.length < 8) title = `${title} that matters`.slice(0, 90);
    let caption = normalizeSentence(post.caption, 'A clear message that connects the audience to the next useful action.').slice(0, 600);
    if (caption.length < 40) caption = `${caption} Amplifi keeps the message specific, useful and connected to the campaign objective.`.slice(0, 600);
    const callToAction = normalizeSentence(post.callToAction, 'Learn more').slice(0, 110);
    const imageDirection = normalizeSentence(post.imageDirection, DEFAULT_VISUALS[index] || DEFAULT_VISUALS[0]).slice(0, 260);
    return { ...post, title, caption, callToAction, imageDirection };
  }).map((post, index, all) => {
    const duplicate = all.findIndex((candidate) => candidate.title.toLowerCase() === post.title.toLowerCase()) !== index;
    return duplicate ? { ...post, title: `${post.title} · ${index + 1}`.slice(0, 90) } : post;
  });
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
  const initial = scoreAmplifiPremiumPackage(posts);
  const repaired = initial.passed ? posts.slice(0, 5) : repairAmplifiPremiumPosts(posts);
  const finalQa = scoreAmplifiPremiumPackage(repaired);
  return {
    graphics: repaired.map((post, index) => ({ ...post, imageUrl: post.imageUrl || creativeImageUrl(post, index, 'carousel') })),
    carousel: buildAmplifiCarousel(repaired),
    shortVideo: buildAmplifiShortVideo(repaired),
    qa: finalQa,
    regenerated: !initial.passed,
    initialQa: initial,
  };
}
