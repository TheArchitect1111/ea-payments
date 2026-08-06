import crypto from 'node:crypto';
import { getCampaign, saveCampaign } from './campaign-store';
import type {
  CampaignAnalytics,
  CampaignAsset,
  CampaignMetricTotals,
  CampaignPlatformMetrics,
  SocialPlatform,
} from './types';

export const AMPLIFI_ATTRIBUTION_COOKIE = 'amplifi_attribution';
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type Attribution = {
  campaignId: string;
  assetId: string;
  exp: number;
};

const ZERO_TOTALS: CampaignMetricTotals = {
  linkClicks: 0,
  ctpStarts: 0,
  ctpCompletions: 0,
};

function analyticsSecret(): string {
  return process.env.AMPLIFI_TRACKING_SECRET?.trim()
    || process.env.ADMIN_SESSION_SECRET?.trim()
    || 'amplifi-attribution-v1';
}

function sign(value: string): string {
  return crypto.createHmac('sha256', analyticsSecret()).update(value).digest('base64url');
}

export function createAttributionCookie(campaignId: string, assetId: string): string {
  const encoded = Buffer.from(JSON.stringify({
    campaignId,
    assetId,
    exp: Date.now() + ATTRIBUTION_TTL_MS,
  } satisfies Attribution)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function readAttributionCookie(value: string | undefined): Attribution | null {
  if (!value) return null;
  const separator = value.lastIndexOf('.');
  if (separator < 1) return null;
  const encoded = value.slice(0, separator);
  const supplied = value.slice(separator + 1);
  const expected = sign(encoded);
  if (supplied.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<Attribution>;
    if (!parsed.campaignId || !parsed.assetId || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) return null;
    return { campaignId: parsed.campaignId, assetId: parsed.assetId, exp: parsed.exp };
  } catch {
    return null;
  }
}

function platformForAsset(asset: CampaignAsset | undefined): SocialPlatform | undefined {
  if (asset?.type === 'social-facebook') return 'facebook';
  if (asset?.type === 'social-instagram') return 'instagram';
  if (asset?.type === 'social-linkedin') return 'linkedin';
  if (asset?.type === 'social-x') return 'x';
  return undefined;
}

export function emptyCampaignAnalytics(platforms: SocialPlatform[] = []): CampaignAnalytics {
  return {
    totals: { ...ZERO_TOTALS },
    byAsset: [],
    daily: [],
    platformMetrics: [...new Set(platforms)].map((platform) => ({
      platform,
      source: 'not-connected',
      impressions: 0,
      reach: 0,
      reactions: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      videoViews: 0,
    })),
    updatedAt: new Date().toISOString(),
  };
}

function increment(totals: CampaignMetricTotals, field: keyof CampaignMetricTotals): CampaignMetricTotals {
  return { ...totals, [field]: totals[field] + 1 };
}

export async function recordCampaignActivity(input: {
  campaignId: string;
  assetId: string;
  linkClick?: boolean;
  ctpStart?: boolean;
  ctpComplete?: boolean;
}): Promise<boolean> {
  const campaign = await getCampaign(input.campaignId);
  if (!campaign) return false;
  const asset = campaign.assets.find((item) => item.id === input.assetId);
  if (!asset) return false;

  const analytics = campaign.analytics ?? emptyCampaignAnalytics(campaign.strategy.platforms);
  const date = new Date().toISOString().slice(0, 10);
  let totals = { ...analytics.totals };
  let assetMetrics = analytics.byAsset.find((item) => item.assetId === input.assetId) ?? {
    assetId: input.assetId,
    platform: platformForAsset(asset),
    ...ZERO_TOTALS,
  };
  let dailyMetrics = analytics.daily.find((item) => item.date === date) ?? { date, ...ZERO_TOTALS };

  for (const [enabled, field] of [
    [input.linkClick, 'linkClicks'],
    [input.ctpStart, 'ctpStarts'],
    [input.ctpComplete, 'ctpCompletions'],
  ] as const) {
    if (!enabled) continue;
    totals = increment(totals, field);
    assetMetrics = increment(assetMetrics, field) as typeof assetMetrics;
    dailyMetrics = increment(dailyMetrics, field) as typeof dailyMetrics;
  }

  const updatedAnalytics: CampaignAnalytics = {
    ...analytics,
    totals,
    byAsset: [...analytics.byAsset.filter((item) => item.assetId !== input.assetId), assetMetrics],
    daily: [...analytics.daily.filter((item) => item.date !== date), dailyMetrics].sort((a, b) => a.date.localeCompare(b.date)),
    updatedAt: new Date().toISOString(),
  };
  await saveCampaign({ ...campaign, analytics: updatedAnalytics });
  return true;
}

function safeCount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0;
}

export async function updateCampaignPlatformMetrics(input: {
  campaignId: string;
  platform: SocialPlatform;
  metrics: Partial<Omit<CampaignPlatformMetrics, 'platform' | 'source' | 'updatedAt'>>;
}): Promise<CampaignAnalytics | null> {
  const campaign = await getCampaign(input.campaignId);
  if (!campaign || !campaign.strategy.platforms.includes(input.platform)) return null;
  const analytics = campaign.analytics ?? emptyCampaignAnalytics(campaign.strategy.platforms);
  const existing = analytics.platformMetrics.find((item) => item.platform === input.platform);
  const updated: CampaignPlatformMetrics = {
    platform: input.platform,
    source: 'manual',
    impressions: safeCount(input.metrics.impressions ?? existing?.impressions),
    reach: safeCount(input.metrics.reach ?? existing?.reach),
    reactions: safeCount(input.metrics.reactions ?? existing?.reactions),
    comments: safeCount(input.metrics.comments ?? existing?.comments),
    shares: safeCount(input.metrics.shares ?? existing?.shares),
    saves: safeCount(input.metrics.saves ?? existing?.saves),
    videoViews: safeCount(input.metrics.videoViews ?? existing?.videoViews),
    updatedAt: new Date().toISOString(),
  };
  const next = {
    ...analytics,
    platformMetrics: [...analytics.platformMetrics.filter((item) => item.platform !== input.platform), updated],
    updatedAt: updated.updatedAt!,
  };
  await saveCampaign({ ...campaign, analytics: next });
  return next;
}

export function campaignPerformance(analytics: CampaignAnalytics) {
  const native = analytics.platformMetrics.reduce((total, item) => ({
    impressions: total.impressions + item.impressions,
    reach: total.reach + item.reach,
    engagements: total.engagements + item.reactions + item.comments + item.shares + item.saves,
  }), { impressions: 0, reach: 0, engagements: 0 });
  return {
    ...native,
    clickThroughRate: native.impressions > 0 ? analytics.totals.linkClicks / native.impressions : null,
    engagementRate: native.reach > 0 ? native.engagements / native.reach : null,
    ctpConversionRate: analytics.totals.linkClicks > 0
      ? analytics.totals.ctpCompletions / analytics.totals.linkClicks
      : null,
  };
}
