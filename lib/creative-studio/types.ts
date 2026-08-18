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

export type CampaignMetricEvent = 'link-click' | 'ctp-start' | 'ctp-complete';

export interface CampaignMetricTotals {
  linkClicks: number;
  ctpStarts: number;
  ctpCompletions: number;
}

export interface CampaignAssetMetrics extends CampaignMetricTotals {
  assetId: string;
  platform?: SocialPlatform;
}

export interface CampaignProductMetrics extends CampaignMetricTotals {
  productId: string;
}

export interface CampaignDailyMetrics extends CampaignMetricTotals {
  date: string;
}

export interface CampaignPlatformMetrics {
  platform: SocialPlatform;
  source: 'not-connected' | 'manual' | 'connected';
  impressions: number;
  reach: number;
  reactions: number;
  comments: number;
  shares: number;
  saves: number;
  videoViews: number;
  updatedAt?: string;
}

export interface CampaignAnalytics {
  totals: CampaignMetricTotals;
  byAsset: CampaignAssetMetrics[];
  byProduct: CampaignProductMetrics[];
  daily: CampaignDailyMetrics[];
  platformMetrics: CampaignPlatformMetrics[];
  updatedAt: string;
}

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
  researchFocus?: string;
  trustedSources?: string[];
}

export type CampaignArchitectureMode = 'single' | 'portfolio';

export interface CampaignCallToAction {
  label: string;
  url?: string;
  conversionGoal?: string;
}

export interface CampaignAudienceSegment {
  id: string;
  name: string;
  need?: string;
  channels: SocialPlatform[];
}

export interface CampaignProductTrack {
  id: string;
  name: string;
  positioning?: string;
  offer?: string;
  audienceIds: string[];
  callToAction: CampaignCallToAction;
  status: 'planned' | 'active' | 'paused' | 'complete';
}

export interface CampaignLaunchWave {
  id: string;
  name: string;
  sequence: number;
  objective?: string;
  startDate?: string;
  endDate?: string;
  productIds: string[];
  audienceIds: string[];
  status: 'planned' | 'active' | 'complete';
}

/**
 * The campaign hierarchy used by Amplifi's orchestration layer. Standard campaigns
 * receive a single-track architecture so existing creation and publishing flows
 * remain unchanged; portfolio campaigns can coordinate multiple offers in waves.
 */
export interface CampaignArchitecture {
  mode: CampaignArchitectureMode;
  masterName: string;
  masterObjective: string;
  defaultCallToAction: CampaignCallToAction;
  audiences: CampaignAudienceSegment[];
  products: CampaignProductTrack[];
  waves: CampaignLaunchWave[];
}

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  domain: string;
  publishedAt?: string;
  accessedAt: string;
  summary: string;
  supportedFacts: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface CampaignResearch {
  status: 'complete' | 'partial' | 'unavailable';
  query: string;
  summary: string;
  sources: ResearchSource[];
  generatedAt: string;
  warnings: string[];
}

export interface CampaignImageSuggestion {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  creator?: string;
  creatorUrl?: string;
  source: 'openverse' | 'generated';
  sourceUrl?: string;
  license: string;
  licenseUrl?: string;
  attribution: string;
  altText: string;
  query: string;
  rightsStatus: 'public-domain-candidate' | 'license-review-required' | 'generated';
  checkedAt: string;
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
  /** The original off-site destination before Amplifi adds first-party attribution. */
  destinationUrl?: string;
  /** The first-party URL used in published campaign copy. */
  trackingUrl?: string;
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
  suggestedImageId?: string;
  productId?: string;
  audienceId?: string;
  launchWaveId?: string;
  portfolioPostIndex?: number;
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
  architecture: CampaignArchitecture;
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
  research?: CampaignResearch;
  imageSuggestions?: CampaignImageSuggestion[];
  analytics?: CampaignAnalytics;
  portalSlug?: string;
  source?: 'creative-studio' | 'amplifi-portal';
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
