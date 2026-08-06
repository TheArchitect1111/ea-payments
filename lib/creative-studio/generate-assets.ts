import { getDefaultBrandProfile } from './brand-profile';
import type {
  AssetPreviewLayout,
  BrandProfile,
  CampaignAsset,
  CampaignBrief,
  CampaignGoalId,
  CampaignStrategy,
  CampaignTimelineItem,
  CreativeCampaign,
  SocialPlatform,
} from './types';

const ASSET_BLUEPRINT: Array<{
  type: CampaignAsset['type'];
  label: string;
  channel: string;
  previewLayout: AssetPreviewLayout;
  publishDestination?: CampaignAsset['publishDestination'];
  platform?: SocialPlatform;
}> = [
  { type: 'landing-page', label: 'Landing Page', channel: 'Website', previewLayout: 'banner', publishDestination: 'website' },
  { type: 'homepage-banner', label: 'Homepage Banner', channel: 'Website', previewLayout: 'banner', publishDestination: 'website' },
  { type: 'flyer', label: 'Flyer', channel: 'Print', previewLayout: 'flyer', publishDestination: 'print' },
  { type: 'poster', label: 'Poster', channel: 'Print', previewLayout: 'flyer', publishDestination: 'print' },
  { type: 'social-instagram', label: 'Instagram Post', channel: 'Instagram', previewLayout: 'social-feed', publishDestination: 'amplifi', platform: 'instagram' },
  { type: 'social-facebook', label: 'Facebook Post', channel: 'Facebook', previewLayout: 'social-feed', publishDestination: 'amplifi', platform: 'facebook' },
  { type: 'social-linkedin', label: 'LinkedIn Post', channel: 'LinkedIn', previewLayout: 'social-feed', publishDestination: 'amplifi', platform: 'linkedin' },
  { type: 'social-x', label: 'X Post', channel: 'X', previewLayout: 'social-feed', publishDestination: 'amplifi', platform: 'x' },
  { type: 'email', label: 'Email Campaign', channel: 'Email', previewLayout: 'email', publishDestination: 'content-request' },
  { type: 'sms', label: 'SMS Message', channel: 'SMS', previewLayout: 'sms', publishDestination: 'content-request' },
  { type: 'portal-announcement', label: 'Portal Announcement', channel: 'Portal', previewLayout: 'banner', publishDestination: 'portal' },
  { type: 'press-release', label: 'Press Release', channel: 'Media', previewLayout: 'document', publishDestination: 'content-request' },
  { type: 'qr-code', label: 'QR Code', channel: 'Events', previewLayout: 'qr', publishDestination: 'print' },
  { type: 'calendar-event', label: 'Calendar Event', channel: 'Calendar', previewLayout: 'document', publishDestination: 'content-request' },
];

function hashtag(value: string): string {
  const cleaned = value.replace(/[^a-z0-9 ]/gi, '').trim().replace(/\s+/g, '');
  return cleaned ? `#${cleaned}` : '';
}

function socialCopy(
  type: CampaignAsset['type'],
  brief: CampaignBrief,
  strategy: CampaignStrategy,
  brand: BrandProfile,
): string {
  const link = brief.registrationLink ?? brief.website;
  const pillar = strategy.contentPillars[0] ?? 'Story';
  const tags = strategy.contentPillars.map(hashtag).filter(Boolean).slice(0, 4).join(' ');

  if (type === 'social-instagram') {
    return [
      brief.title,
      '',
      brief.summary,
      '',
      `${brief.callToAction}${link ? ` — link: ${link}` : ''}`,
      '',
      [hashtag(brief.organization ?? brand.organizationName), tags].filter(Boolean).join(' '),
    ].join('\n');
  }

  if (type === 'social-facebook') {
    return [
      brief.title,
      '',
      brief.summary,
      '',
      `${brief.callToAction}${link ? `: ${link}` : ''}`,
      '',
      `Campaign focus: ${pillar}`,
    ].join('\n');
  }

  if (type === 'social-linkedin') {
    return [
      brief.title,
      '',
      brief.summary,
      '',
      `Why it matters: ${strategy.objective}.`,
      `${brief.callToAction}${link ? `: ${link}` : ''}`,
    ].join('\n');
  }

  return `${brief.title} — ${brief.callToAction}${link ? ` ${link}` : ''}`;
}

function buildAsset(
  blueprint: (typeof ASSET_BLUEPRINT)[number],
  brief: CampaignBrief,
  strategy: CampaignStrategy,
  brand: BrandProfile,
  index: number,
): CampaignAsset {
  const id = `asset-${blueprint.type}-${index}`;
  const body =
    blueprint.type === 'email'
      ? `Subject: ${brief.title}\n\n${brief.summary}\n\n${brief.callToAction}: ${brief.registrationLink ?? brief.website ?? brand.preferredCta}`
      : blueprint.type === 'sms'
        ? `${brief.title} — ${brief.callToAction}${brief.registrationLink ? ` ${brief.registrationLink}` : ''}`
        : blueprint.type.startsWith('social')
          ? socialCopy(blueprint.type, brief, strategy, brand)
          : brief.summary;
  const maxLength = blueprint.type === 'social-x' ? 280 : blueprint.type.startsWith('social') ? 2200 : body.length;

  return {
    id,
    type: blueprint.type,
    label: blueprint.label,
    channel: blueprint.channel,
    status: 'ready',
    previewTitle: brief.title,
    previewBody: body.slice(0, maxLength),
    previewLayout: blueprint.previewLayout,
    publishDestination: blueprint.publishDestination,
    href: brief.registrationLink ?? brief.website,
  };
}

function buildTimeline(assets: CampaignAsset[], brief: CampaignBrief): CampaignTimelineItem[] {
  const find = (...types: CampaignAsset['type'][]) =>
    assets.filter((asset) => types.includes(asset.type)).map((asset) => asset.id);

  return [
    { id: 'tl-today', offsetDays: 0, label: 'Campaign launch', assetIds: find('email', 'social-facebook', 'social-instagram', 'portal-announcement') },
    { id: 'tl-week', offsetDays: 7, label: 'Proof + reminder', assetIds: find('social-instagram', 'social-facebook', 'social-x', 'sms') },
    { id: 'tl-final', offsetDays: brief.date ? -3 : 14, label: brief.date ? 'Last chance' : 'Follow-up story', assetIds: find('flyer', 'poster', 'social-linkedin') },
    { id: 'tl-after', offsetDays: brief.date ? 1 : 21, label: 'Results + thank you', assetIds: find('landing-page', 'press-release') },
  ].filter((item) => item.assetIds.length > 0);
}

export function generateCampaignPackage(input: {
  id: string;
  goalId: CampaignGoalId;
  goalLabel: string;
  story: string;
  brief: CampaignBrief;
  strategy: CampaignStrategy;
  organizationId: string;
  brand?: BrandProfile;
}): Pick<CreativeCampaign, 'assets' | 'timeline' | 'completionPercent'> {
  const brand = input.brand ?? getDefaultBrandProfile(input.organizationId);
  const blueprints = ASSET_BLUEPRINT.filter(
    (blueprint) => !blueprint.platform || input.strategy.platforms.includes(blueprint.platform),
  );
  const assets = blueprints.map((blueprint, index) =>
    buildAsset(blueprint, input.brief, input.strategy, brand, index),
  );
  const timeline = buildTimeline(assets, input.brief);
  const ready = assets.filter((asset) => asset.status === 'ready' || asset.status === 'published').length;
  const completionPercent = Math.round((ready / assets.length) * 100);

  return { assets, timeline, completionPercent };
}
