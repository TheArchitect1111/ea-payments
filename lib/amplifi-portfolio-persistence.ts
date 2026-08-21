import { emptyCampaignAnalytics } from '@/lib/creative-studio/campaign-analytics';
import { saveCampaignDurably } from '@/lib/creative-studio/campaign-store';
import type { CampaignArchitecture, CampaignAsset, CreativeCampaign, SocialPlatform } from '@/lib/creative-studio/types';
import type { PortfolioCampaignPost } from '@/lib/amplifi-campaign-command';

const PLATFORM_TYPES: Record<SocialPlatform, CampaignAsset['type']> = {
  facebook: 'social-facebook',
  instagram: 'social-instagram',
  linkedin: 'social-linkedin',
  x: 'social-x',
};

function campaignId(): string {
  return `camp-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function persistAmplifiPortfolioCampaign(input: {
  organizationId: string;
  portalSlug: string;
  title: string;
  objective: string;
  tone: string;
  platforms: SocialPlatform[];
  architecture: CampaignArchitecture;
  posts: PortfolioCampaignPost[];
}): Promise<{ campaign: CreativeCampaign; durable: boolean; error?: string }> {
  const id = campaignId();
  const now = new Date().toISOString();
  const trackingOrigin = (process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXT_PUBLIC_BASE_URL?.trim() || 'https://efficiencyarchitects.online').replace(/\/$/, '');
  const assets = input.posts.flatMap((post, postIndex) => input.platforms.map((platform) => {
    const assetId = `asset-${postIndex + 1}-${platform}`;
    const product = input.architecture.products.find((item) => item.id === post.productId);
    const destinationUrl = product?.callToAction.url;
    const trackingUrl = destinationUrl ? `${trackingOrigin}/r/amplifi/${encodeURIComponent(id)}/${encodeURIComponent(assetId)}` : undefined;
    return {
      id: assetId,
      type: PLATFORM_TYPES[platform],
      label: `${post.title} · ${platform}`,
      channel: platform,
      status: 'draft' as const,
      previewTitle: post.title,
      previewBody: `${post.caption}\n\n${trackingUrl || post.callToAction}`.trim(),
      previewLayout: platform === 'instagram' ? 'social-feed' as const : 'social-feed' as const,
      thumbnailUrl: post.imageUrl,
      renderUrl: post.imageUrl,
      href: trackingUrl,
      destinationUrl,
      trackingUrl,
      publishDestination: 'amplifi' as const,
      contentType: 'direct-invitation' as const,
      funnelStage: 'convert' as const,
      socialFormat: 'static' as const,
      conversionAction: trackingUrl || post.callToAction,
      proofStatus: 'not-required' as const,
      productId: post.productId,
      audienceId: post.audienceId,
      launchWaveId: post.waveId,
      portfolioPostIndex: postIndex,
    } satisfies CampaignAsset;
  }));
  const campaign: CreativeCampaign = {
    id,
    goalId: 'launch-new',
    goalLabel: 'Launch products and services',
    story: input.objective,
    brief: {
      title: input.title,
      audience: input.architecture.audiences.map((item) => item.name).join('; '),
      callToAction: input.architecture.defaultCallToAction.label,
      sponsors: [],
      organization: input.organizationId,
      summary: input.objective,
      missingFields: [],
    },
    strategy: {
      objective: input.objective,
      audience: input.architecture.audiences.map((item) => item.name).join('; '),
      platforms: input.platforms,
      tone: input.tone,
      successMetric: 'Conversions',
      contentPillars: input.architecture.products.map((item) => item.name).slice(0, 6),
    },
    architecture: input.architecture,
    assets,
    timeline: input.architecture.waves.map((wave) => ({
      id: wave.id,
      offsetDays: Math.max(0, (wave.sequence - 1) * 7),
      label: wave.name,
      assetIds: assets.filter((asset) => asset.launchWaveId === wave.id).map((asset) => asset.id),
    })),
    completionPercent: 0,
    createdAt: now,
    updatedAt: now,
    organizationId: input.organizationId,
    portalSlug: input.portalSlug,
    source: 'amplifi-portal',
    analytics: emptyCampaignAnalytics(input.platforms),
  };
  return saveCampaignDurably(campaign);
}
