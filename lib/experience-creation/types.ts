/**
 * Experience Creation Engine — durable artifact schemas (v1).
 * These are composition intelligence inputs; Puck remains the page representation.
 */
export const EXPERIENCE_CREATION_SCHEMA_VERSION = 1 as const;

export type ClaimStatus = 'verified' | 'supported_inference' | 'unverified_lead' | 'unknown';

export type ArtifactMeta = {
  schemaVersion: typeof EXPERIENCE_CREATION_SCHEMA_VERSION;
  projectId: string;
  subjectIdentity: string;
  createdAt: string;
  updatedAt: string;
  provider: {
    id: string;
    model?: string;
    notes?: string;
  };
  inputArtifactIds: string[];
  provenanceNotes: string;
  confidence: number;
  completeness: number;
  warnings: string[];
  validation: {
    ok: boolean;
    reasons: string[];
  };
};

export type KnowledgeClaim = {
  id: string;
  text: string;
  status: ClaimStatus;
  sourceUrls: string[];
  category:
    | 'identity'
    | 'biography'
    | 'timeline'
    | 'education'
    | 'career'
    | 'organization'
    | 'accomplishment'
    | 'program'
    | 'current_work'
    | 'audience'
    | 'media'
    | 'quote'
    | 'other';
};

export type SubjectKnowledgePack = ArtifactMeta & {
  kind: 'subject_knowledge_pack';
  verifiedIdentity: {
    name: string;
    status: 'resolved' | 'ambiguous' | 'incomplete' | 'search_failed';
    confidence: number;
    selectedUrl: string | null;
    reason: string;
  };
  alternativeIdentities: Array<{ name: string; url?: string; reason?: string }>;
  officialWebsite: string | null;
  socialProfiles: Array<{ network: string; url: string }>;
  locations: string[];
  professionalRoles: string[];
  biography: string;
  timeline: Array<{ label: string; detail: string; sourceUrls?: string[] }>;
  education: string[];
  careerHistory: string[];
  organizations: string[];
  accomplishments: string[];
  programs: string[];
  currentWork: string[];
  audiences: string[];
  interviewsAndMedia: Array<{ title: string; url: string }>;
  quotes: Array<{ text: string; sourceUrl?: string }>;
  callsToAction: string[];
  citations: Array<{ url: string; title?: string; usedFor: string[] }>;
  conflictingClaims: string[];
  unsupportedClaims: string[];
  unknowns: string[];
  claims: KnowledgeClaim[];
};

export type MediaUsageStatus =
  | 'discovered'
  | 'preview_only'
  | 'publication_candidate'
  | 'approved'
  | 'rejected'
  | 'user_supplied';

export type MediaLicenseClass =
  | 'public_domain'
  | 'creative_commons'
  | 'unclear'
  | 'unsupported';

export type MediaFocalAnalysis = {
  status: 'complete' | 'pending' | 'blocked' | 'skipped_no_image' | 'failed';
  provider: string;
  faceCount: number;
  photographType: 'portrait' | 'group' | 'no_people' | 'unknown';
  objectPosition?: string;
  cropHints?: Array<{
    viewport: string;
    objectPosition: string;
    focalPoint: { x: number; y: number };
  }>;
  error?: string;
  analyzedAt?: string;
};

export type MediaAsset = {
  id: string;
  url: string;
  kind: 'logo' | 'portrait' | 'group' | 'location' | 'event' | 'product' | 'other';
  width?: number;
  height?: number;
  aspectRatio?: string;
  qualityScore: number;
  facePresent?: boolean;
  focalPoint?: { x: number; y: number };
  sourceUrl: string;
  rightsStatus: 'unknown' | 'preview_only' | 'approved' | 'blocked';
  previewEligible: boolean;
  publicationEligible: boolean;
  duplicateGroupId?: string;
  /** Openverse / discovery metadata */
  usageStatus?: MediaUsageStatus;
  title?: string;
  creator?: string | null;
  license?: string;
  licenseUrl?: string | null;
  licenseClass?: MediaLicenseClass;
  attribution?: string;
  mediaProvider?: string;
  foreignIdentifier?: string;
  licenseVerified?: boolean;
  licenseVerificationNotes?: string;
  rejectionReason?: string;
  checksum?: string;
  format?: string;
  assignedSections?: string[];
  focal?: MediaFocalAnalysis;
};

export type MediaBrandPack = ArtifactMeta & {
  kind: 'media_brand_pack';
  assets: MediaAsset[];
  colors: string[];
  typographyClues: string[];
  brandPatterns: string[];
  missingMediaRequests: string[];
  intentionalTypographyLed: boolean;
};

export type ContentCreativePack = ArtifactMeta & {
  kind: 'content_creative_pack';
  coreStory: string;
  centralTension: string;
  positioning: string;
  audience: string;
  desiredEmotionalResponse: string;
  brandPersonality: string;
  premises: Array<{
    id: string;
    name: string;
    narrativeLens: string;
    visualMetaphor: string;
    emotionalGoal: string;
    heroHeadline: string;
    heroSupporting: string;
    sectionSequence: string[];
    whyThisFitsEvidence: string;
  }>;
  biography: string;
  timelineNarrative: string;
  accomplishmentNarratives: string[];
  currentWorkNarrative: string;
  organizationDescriptions: string[];
  sectionHeadlines: string[];
  sectionBodies: string[];
  quotes: string[];
  callsToAction: string[];
  websiteJourney: string[];
  portalPurpose: string;
  websiteToPortalTransition: string;
  visualThesis: string;
  typographyDirection: string;
  colorLogic: string;
  photographyDirection: string;
  motionDirection: string;
  prohibitedPatterns: string[];
  claimToSourceMap: Array<{ claim: string; sourceUrls: string[] }>;
};

export type ExperienceManifest = ArtifactMeta & {
  kind: 'experience_manifest';
  premiseId: string;
  premiseName: string;
  storySequence: string[];
  pageStructure: Array<{
    sectionId: string;
    composition: string;
    headline: string;
    body: string;
    imageAssetId?: string;
    /** CSS object-position from face/focal analysis */
    objectPosition?: string;
    ctaLabel?: string;
  }>;
  layoutRules: string[];
  typographyScale: string;
  colorTokens: { primary: string; accent: string; surface: string };
  fullBleedBehavior: string;
  navigation: string[];
  ctaBehavior: {
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
  motion: string;
  portalSkin: {
    purpose: string;
    firstView: string[];
    modules: string[];
    nextBestAction: string;
  };
  websiteToPortalContinuity: string;
  accessibilityRequirements: string[];
  evidenceReferences: string[];
  previewOnlyRestrictions: string[];
};

export type ExperienceCreationBundle = {
  knowledge: SubjectKnowledgePack;
  media: MediaBrandPack;
  content: ContentCreativePack;
  manifests: ExperienceManifest[];
  critic: {
    ok: boolean;
    scores: Record<string, number>;
    reasons: string[];
    repairHistory: string[];
  };
};
