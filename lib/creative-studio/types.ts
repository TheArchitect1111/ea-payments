export type CampaignGoalId =
  | 'promote-event'
  | 'recruit-athletes'
  | 'enroll-students'
  | 'fill-camp'
  | 'raise-donations'
  | 'find-sponsors'
  | 'celebrate-success'
  | 'announcement'
  | 'launch-new'
  | 'custom';

export type CampaignAssetType =
  | 'landing-page'
  | 'homepage-banner'
  | 'flyer'
  | 'poster'
  | 'social-instagram'
  | 'social-facebook'
  | 'social-linkedin'
  | 'social-x'
  | 'email'
  | 'sms'
  | 'portal-announcement'
  | 'press-release'
  | 'qr-code'
  | 'calendar-event';

export type CampaignAssetStatus =
  | 'pending'
  | 'ready'
  | 'scheduled'
  | 'queued'
  | 'published'
  | 'failed'
  | 'blocked'
  | 'draft';

export type AssetPreviewLayout =
  | 'banner'
  | 'flyer'
  | 'social-story'
  | 'social-feed'
  | 'email'
  | 'sms'
  | 'document'
  | 'qr';

export interface CampaignBrief {
  title: string;
  audience: string;
  date?: string;
  time?: string;
  location?: string;
  callToAction: string;
  website?: string;
  registrationLink?: string;
  sponsors: string[];
  organization?: string;
  summary: string;
  missingFields: string[];
}

export interface PublishReceipt {
  status: 'blocked' | 'queued' | 'published' | 'failed';
  mode: 'webhook' | 'airtable' | 'manual' | 'stub';
  detail: string;
  attemptedAt: string;
  retryable: boolean;
  externalId?: string;
  idempotencyKey?: string;
  href?: string;
}

export interface CampaignAsset {
  id: string;
  type: CampaignAssetType;
  label: string;
  channel: string;
  status: CampaignAssetStatus;
  previewTitle: string;
  previewBody: string;
  previewLayout: AssetPreviewLayout;
  href?: string;
  publishDestination?: 'amplifi' | 'portal' | 'content-request' | 'website' | 'print';
  mediaIds?: string[];
  thumbnailUrl?: string;
  renderUrl?: string;
  publishReceipt?: PublishReceipt;
}

export type MediaAssetKind = 'image' | 'logo' | 'document' | 'video';

export interface MediaAsset {
  id: string;
  organizationId: string;
  kind: MediaAssetKind;
  label: string;
  url: string;
  mimeType?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PublishResult extends PublishReceipt {
  ok: boolean;
}

export interface CampaignTimelineItem {
  id: string;
  offsetDays: number;
  label: string;
  assetIds: string[];
}

export interface CreativeCampaign {
  id: string;
  goalId: CampaignGoalId;
  goalLabel: string;
  story: string;
  brief: CampaignBrief;
  assets: CampaignAsset[];
  timeline: CampaignTimelineItem[];
  completionPercent: number;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface BrandProfile {
  organizationId: string;
  organizationName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  typography?: string;
  photographyStyle?: string;
  voice: string;
  missionStatement?: string;
  audience?: string;
  preferredHeadlines?: string[];
  preferredCta: string;
  updatedAt?: string;
}
