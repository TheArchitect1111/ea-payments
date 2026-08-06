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
  | 'review'
  | 'approved'
  | 'scheduled'
  | 'publishing'
  | 'queued'
  | 'published'
  | 'failed'
  | 'blocked'
  | 'cancelled'
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

export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'x';

export type FunnelStage = 'attract' | 'trust' | 'help' | 'convert';

export type CampaignContentType =
  | 'problem-recognition'
  | 'client-transformation'
  | 'diagnostic'
  | 'expert-video'
  | 'before-after'
  | 'proof'
  | 'objection-answer'
  | 'direct-invitation';

export type SocialFormat = 'static' | 'carousel' | 'reel' | 'story' | 'text';

export interface OrganizationStrategyPack {
  id: string;
  displayName: string;
  aliases: string[];
  defaultAudience: string;
  primaryAction: string;
  conversionUrl: string;
  contentMix: Array<{ contentType: CampaignContentType; funnelStage: FunnelStage }>;
  voiceRules: string[];
  prohibitedClaims: string[];
  proofRules: string[];
  hashtags: string[];
  posture: string;
  narrativeArc: string[];
  prohibitedLanguage: string[];
  criticQuestions: string[];
}

export interface CampaignStrategy {
  objective: string;
  audience: string;
  startDate?: string;
  endDate?: string;
  platforms: SocialPlatform[];
  tone: string;
  successMetric: string;
  successTarget?: number;
  contentPillars: string[];
}

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

export interface AssetApproval {
  status: 'not-requested' | 'review' | 'approved' | 'rejected';
  requestedAt?: string;
  requestedBy?: string;
  decidedAt?: string;
  decidedBy?: string;
  note?: string;
}

export interface AssetSchedule {
  publishAt: string;
  timezone: string;
  scheduledAt: string;
  scheduledBy: string;
  cancelledAt?: string;
  cancelledBy?: string;
}

export interface MediaValidationResult {
  valid: boolean;
  checkedAt: string;
  errors: string[];
  warnings: string[];
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
  mediaValidation?: MediaValidationResult;
  approval?: AssetApproval;
  schedule?: AssetSchedule;
  contentType?: CampaignContentType;
  funnelStage?: FunnelStage;
  socialFormat?: SocialFormat;
  conversionAction?: string;
  proofStatus?: 'not-required' | 'verified' | 'missing';
  qualityScore?: number;
  qualityIssues?: string[];
  variantGroupId?: string;
}

export type MediaAssetKind = 'image' | 'logo' | 'document' | 'video';

export interface MediaAsset {
  id: string;
  organizationId: string;
  kind: MediaAssetKind;
  label: string;
  url: string;
  mimeType?: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
  altText?: string;
  rightsConfirmed?: boolean;
  rightsSource?: string;
  publiclyReachable?: boolean;
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
  strategy: CampaignStrategy;
  assets: CampaignAsset[];
  timeline: CampaignTimelineItem[];
  completionPercent: number;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  paused?: boolean;
  pausedAt?: string;
  pausedBy?: string;
  generationVersion?: number;
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
