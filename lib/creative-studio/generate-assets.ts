import { getDefaultBrandProfile } from './brand-profile';
import type {
  AssetPreviewLayout,
  BrandProfile,
  CampaignAsset,
  CampaignBrief,
  CampaignGoalId,
  CampaignTimelineItem,
  CreativeCampaign,
} from './types';

const ASSET_BLUEPRINT: Array<{
  type: CampaignAsset['type'];
  label: string;
  channel: string;
  previewLayout: AssetPreviewLayout;
  publishDestination?: CampaignAsset['publishDestination'];
}> = [
  { type: 'landing-page', label: 'Landing Page', channel: 'Website', previewLayout: 'banner', publishDestination: 'website' },
  { type: 'homepage-banner', label: 'Homepage Banner', channel: 'Website', previewLayout: 'banner', publishDestination: 'website' },
  { type: 'flyer', label: 'Flyer', channel: 'Print', previewLayout: 'flyer', publishDestination: 'print' },
  { type: 'poster', label: 'Poster', channel: 'Print', previewLayout: 'flyer', publishDestination: 'print' },
  { type: 'social-instagram', label: 'Instagram Story', channel: 'Instagram', previewLayout: 'social-story', publishDestination: 'amplifi' },
  { type: 'social-facebook', label: 'Facebook Post', channel: 'Facebook', previewLayout: 'social-feed', publishDestination: 'amplifi' },
  { type: 'social-linkedin', label: 'LinkedIn Post', channel: 'LinkedIn', previewLayout: 'social-feed', publishDestination: 'amplifi' },
  { type: 'social-x', label: 'X Post', channel: 'X', previewLayout: 'social-feed', publishDestination: 'amplifi' },
  { type: 'email', label: 'Email Campaign', channel: 'Email', previewLayout: 'email', publishDestination: 'content-request' },
  { type: 'sms', label: 'SMS Message', channel: 'SMS', previewLayout: 'sms', publishDestination: 'content-request' },
  { type: 'portal-announcement', label: 'Portal Announcement', channel: 'Portal', previewLayout: 'banner', publishDestination: 'portal' },
  { type: 'press-release', label: 'Press Release', channel: 'Media', previewLayout: 'document', publishDestination: 'content-request' },
  { type: 'qr-code', label: 'QR Code', channel: 'Events', previewLayout: 'qr', publishDestination: 'print' },
  { type: 'calendar-event', label: 'Calendar Event', channel: 'Calendar', previewLayout: 'document', publishDestination: 'content-request' },
];

function socialCopy(brief: CampaignBrief, brand: BrandProfile): string {
  const parts = [brief.title];
  if (brief.date) parts.push(brief.date);
  if (brief.location) parts.push(brief.location);
  parts.push(brief.callToAction);
  return parts.join(' · ');
}

function buildAsset(
  blueprint: (typeof ASSET_BLUEPRINT)[number],
  brief: CampaignBrief,
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
          ? socialCopy(brief, brand)
          : brief.summary;

  return {
    id,
    type: blueprint.type,
    label: blueprint.label,
    channel: blueprint.channel,
    status: 'ready',
    previewTitle: brief.title,
    previewBody: body.slice(0, 280),
    previewLayout: blueprint.previewLayout,
    publishDestination: blueprint.publishDestination,
    href: brief.registrationLink ?? brief.website,
  };
}

function buildTimeline(assets: CampaignAsset[], brief: CampaignBrief): CampaignTimelineItem[] {
  const find = (...types: CampaignAsset['type'][]) =>
    assets.filter((a) => types.includes(a.type)).map((a) => a.id);

  return [
    { id: 'tl-today', offsetDays: 0, label: 'Registration announcement', assetIds: find('email', 'social-facebook', 'portal-announcement') },
    { id: 'tl-week', offsetDays: 7, label: 'Reminder + social push', assetIds: find('social-instagram', 'social-x', 'sms') },
    { id: 'tl-final', offsetDays: brief.date ? -3 : 14, label: brief.date ? 'Last chance' : 'Follow-up story', assetIds: find('flyer', 'poster', 'social-linkedin') },
    { id: 'tl-after', offsetDays: brief.date ? 1 : 21, label: 'Thank you + gallery', assetIds: find('landing-page', 'press-release') },
  ];
}

export function generateCampaignPackage(input: {
  id: string;
  goalId: CampaignGoalId;
  goalLabel: string;
  story: string;
  brief: CampaignBrief;
  organizationId: string;
  brand?: BrandProfile;
}): Pick<CreativeCampaign, 'assets' | 'timeline' | 'completionPercent'> {
  const brand = input.brand ?? getDefaultBrandProfile(input.organizationId);
  const assets = ASSET_BLUEPRINT.map((bp, index) => buildAsset(bp, input.brief, brand, index));
  const timeline = buildTimeline(assets, input.brief);
  const ready = assets.filter((a) => a.status === 'ready' || a.status === 'published').length;
  const completionPercent = Math.round((ready / assets.length) * 100);

  return { assets, timeline, completionPercent };
}
