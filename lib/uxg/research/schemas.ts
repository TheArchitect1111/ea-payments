/**
 * Versioned ResearchCrawlResult contract for UXG deep research.
 * Shared conceptually with services/uxg-research-worker (JSON Schema mirror).
 */
import { z } from 'zod';

export const RESEARCH_CRAWL_SCHEMA_VERSION = 1 as const;

export const MediaUsageStatusSchema = z.enum([
  'discovered',
  'preview_only',
  'publication_candidate',
  'approved',
  'rejected',
  'user_supplied',
]);

export const AssetTypeSchema = z.enum([
  'logo',
  'favicon',
  'og_image',
  'social_share',
  'photo',
  'product',
  'document',
  'color',
  'font',
  'brand_language',
]);

export const ResearchCrawlRequestSchema = z.object({
  subjectName: z.string().trim().min(1).max(200),
  distinguishingDetail: z.string().trim().max(2000).optional(),
  knownUrls: z.array(z.string().url()).max(20).default([]),
  candidateUrls: z.array(z.string().url()).max(40).default([]),
  maxPages: z.number().int().min(1).max(25).default(12),
  crawlDepth: z.number().int().min(0).max(4).default(2),
  assetTypes: z.array(AssetTypeSchema).default([
    'logo',
    'favicon',
    'og_image',
    'photo',
    'product',
    'document',
    'color',
    'font',
    'brand_language',
  ]),
  allowDomains: z.array(z.string().min(1)).max(40).optional(),
  blockDomains: z.array(z.string().min(1)).max(80).optional(),
  jobId: z.string().trim().max(120).optional(),
});

export type ResearchCrawlRequest = z.infer<typeof ResearchCrawlRequestSchema>;

export const EvidenceClaimCategorySchema = z.enum([
  'identity',
  'role',
  'organization',
  'service',
  'geography',
  'history',
  'mission',
  'audience',
  'contact',
  'leadership',
  'program',
  'product',
  'other',
]);

export const ResearchEvidenceSchema = z.object({
  claim: z.string().min(1),
  category: EvidenceClaimCategorySchema,
  sourceUrl: z.string().url(),
  pageTitle: z.string().nullish(),
  excerpt: z.string().nullish(),
  publishedAt: z.string().nullish(),
  retrievedAt: z.string(),
  confidence: z.number().min(0).max(1),
  independentlyCorroborated: z.boolean().default(false),
});

export const ResearchIdentitySchema = z.object({
  canonicalName: z.string().min(1),
  entityType: z.enum(['person', 'organization', 'product', 'unknown']),
  role: z.string().nullish(),
  organization: z.string().nullish(),
  geography: z.array(z.string()).default([]),
  officialDomains: z.array(z.string()).default([]),
  socialProfiles: z
    .array(
      z.object({
        network: z.string(),
        url: z.string().url(),
      }),
    )
    .default([]),
  identityVerified: z.boolean().default(false),
  identityStatus: z
    .enum(['resolved', 'needs_clarification', 'incomplete', 'failed'])
    .default('incomplete'),
  clarificationQuestion: z.string().nullish(),
  employerAffiliated: z.boolean().default(false),
  employerDomain: z.string().nullish(),
  rejectedDomains: z
    .array(
      z.object({
        domain: z.string(),
        url: z.string().nullish(),
        reason: z.string(),
      }),
    )
    .default([]),
});

export const ResearchOrganizationSchema = z.object({
  mission: z.string().nullish(),
  services: z.array(z.string()).default([]),
  audiences: z.array(z.string()).default([]),
  history: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  leadership: z.array(z.string()).default([]),
  contactPaths: z.array(z.string()).default([]),
  callsToAction: z.array(z.string()).default([]),
});

export const BrandAssetSchema = z.object({
  kind: z.enum([
    'logo',
    'favicon',
    'app_icon',
    'og_image',
    'social_share',
    'color',
    'css_variable',
    'font_family',
    'brand_language',
  ]),
  value: z.string().min(1),
  sourceUrl: z.string().url(),
  confidence: z.number().min(0).max(1).default(0.5),
  consistentAcrossSources: z.boolean().default(false),
  notes: z.string().nullish(),
  ownership: z.enum(['subject_owned', 'employer_affiliated', 'unknown']).default('unknown'),
});

export const BrandProfileSchema = z.object({
  logos: z.array(BrandAssetSchema).default([]),
  colors: z.array(BrandAssetSchema).default([]),
  fonts: z.array(BrandAssetSchema).default([]),
  languageSignals: z.array(BrandAssetSchema).default([]),
  overallConfidence: z.number().min(0).max(1).default(0),
  authoritativeColor: z.string().nullish(),
  authoritativeFont: z.string().nullish(),
  employerAffiliated: z.boolean().default(false),
});

export const MediaAssetCrawlSchema = z.object({
  originalUrl: z.string().url(),
  pageUrl: z.string().url(),
  altText: z.string().nullish(),
  caption: z.string().nullish(),
  nearbyText: z.string().nullish(),
  width: z.number().int().nonnegative().nullish(),
  height: z.number().int().nonnegative().nullish(),
  mimeType: z.string().nullish(),
  likelySubject: z.string().nullish(),
  faceCount: z.number().int().min(0).nullish(),
  relevanceCategory: z
    .enum(['logo', 'product', 'community', 'environment', 'portrait', 'document', 'other'])
    .default('other'),
  licenseEvidence: z.string().nullish(),
  attribution: z.string().nullish(),
  usageStatus: MediaUsageStatusSchema.default('preview_only'),
  perceptualHash: z.string().nullish(),
  durableUrl: z.string().url().nullish(),
  rejected: z.boolean().default(false),
  rejectionReason: z.string().nullish(),
  ownership: z.enum(['subject_owned', 'employer_affiliated', 'unknown']).default('unknown'),
});

export const DocumentAssetSchema = z.object({
  url: z.string().url(),
  title: z.string().nullish(),
  description: z.string().nullish(),
  mimeType: z.string().nullish(),
  extractedTextStatus: z.enum(['pending', 'extracted', 'unsupported', 'failed']).default('pending'),
  excerpt: z.string().nullish(),
});

export const ResearchDiagnosticsSchema = z.object({
  pagesFetched: z.number().int().min(0).default(0),
  pagesFailed: z.number().int().min(0).default(0),
  retries: z.number().int().min(0).default(0),
  durationMs: z.number().min(0).default(0),
  errors: z
    .array(
      z.object({
        url: z.string().nullish(),
        code: z.string(),
        message: z.string(),
      }),
    )
    .default([]),
  provider: z.string().default('crawl4ai'),
  workerVersion: z.string().nullish(),
});

export const ResearchCrawlJobMetaSchema = z.object({
  jobId: z.string(),
  status: z.enum(['queued', 'running', 'succeeded', 'failed', 'partial']),
  startedAt: z.string(),
  finishedAt: z.string().nullish(),
  attempt: z.number().int().min(1).default(1),
});

export const ResearchCrawlResultSchema = z.object({
  schemaVersion: z.literal(RESEARCH_CRAWL_SCHEMA_VERSION),
  identity: ResearchIdentitySchema,
  evidence: z.array(ResearchEvidenceSchema).default([]),
  organization: ResearchOrganizationSchema.default({}),
  brandAssets: z.array(BrandAssetSchema).default([]),
  brandProfile: BrandProfileSchema.optional(),
  mediaAssets: z.array(MediaAssetCrawlSchema).default([]),
  documents: z.array(DocumentAssetSchema).default([]),
  diagnostics: ResearchDiagnosticsSchema.default({}),
  job: ResearchCrawlJobMetaSchema,
});

export type ResearchCrawlResult = z.infer<typeof ResearchCrawlResultSchema>;
export type ResearchEvidence = z.infer<typeof ResearchEvidenceSchema>;
export type BrandProfile = z.infer<typeof BrandProfileSchema>;
export type BrandAsset = z.infer<typeof BrandAssetSchema>;
export type MediaAssetCrawl = z.infer<typeof MediaAssetCrawlSchema>;

export function parseResearchCrawlRequest(input: unknown): ResearchCrawlRequest {
  return ResearchCrawlRequestSchema.parse(input);
}

export function parseResearchCrawlResult(input: unknown): ResearchCrawlResult {
  return ResearchCrawlResultSchema.parse(input);
}

export function safeParseResearchCrawlResult(input: unknown) {
  return ResearchCrawlResultSchema.safeParse(input);
}

export type CompletenessBreakdown = {
  score: number;
  /** Failing gate when identity/domain is wrong or unverified. */
  pass: boolean;
  parts: {
    identity: number;
    content: number;
    brand: number;
    media: number;
    licensing: number;
  };
  reasons: string[];
};

/**
 * Honest completeness — wrong/unverified official domain forces fail.
 * Media quantity cannot rescue identity or licensing failures.
 */
export function scoreResearchCrawlCompleteness(result: ResearchCrawlResult): CompletenessBreakdown {
  const reasons: string[] = [];
  const verified = result.identity.identityVerified === true;
  const status = result.identity.identityStatus || 'incomplete';
  const hasDomain = result.identity.officialDomains.length > 0;

  let identity = 0;
  if (result.identity.canonicalName && result.identity.entityType !== 'unknown') identity += 0.35;
  if (hasDomain) identity += 0.25;
  if (verified && status === 'resolved') identity += 0.4;
  else {
    reasons.push(
      status === 'needs_clarification'
        ? 'identity needs clarification — official domain not verified'
        : 'official domain missing or unverified',
    );
  }
  if (status === 'needs_clarification' || status === 'failed' || !verified) {
    identity = Math.min(identity, 0.35);
  }

  const sourceBacked = result.evidence.filter((e) => e.sourceUrl && e.claim.trim().length > 20);
  const content = Math.min(
    1,
    (sourceBacked.length >= 1 ? 0.45 : 0) +
      Math.min(0.35, sourceBacked.length * 0.12) +
      (result.organization.mission ? 0.2 : 0),
  );
  if (sourceBacked.length === 0) reasons.push('no source-backed claims');

  const logos = [
    ...result.brandAssets.filter((b) => b.kind === 'logo' || b.kind === 'favicon' || b.kind === 'app_icon'),
    ...result.mediaAssets.filter((m) => !m.rejected && m.relevanceCategory === 'logo'),
  ];
  const confidentColors = result.brandAssets.filter(
    (b) =>
      (b.kind === 'color' || b.kind === 'css_variable') &&
      (b.consistentAcrossSources || b.confidence >= 0.6),
  );
  // Deduplicate colors by value.
  const uniqueColors = new Set(confidentColors.map((c) => c.value.toLowerCase()));
  let brand = 0;
  if (logos.length > 0) brand += 0.55;
  else reasons.push('missing logo candidates');
  brand += Math.min(0.45, uniqueColors.size * 0.15);
  // Raw color spam without confidence must not inflate.
  if (uniqueColors.size === 0 && result.brandAssets.some((b) => b.kind === 'color')) {
    reasons.push('colors present but not confident/deduplicated');
  }

  const usableMedia = result.mediaAssets.filter((m) => !m.rejected);
  const media = Math.min(0.7, usableMedia.length * 0.12);
  // Cap media contribution — cannot substitute for identity.
  const mediaCapped = verified ? media : Math.min(media, 0.25);

  const licensedOk = usableMedia.every(
    (m) =>
      m.usageStatus === 'preview_only' ||
      m.usageStatus === 'user_supplied' ||
      m.usageStatus === 'approved' ||
      Boolean(m.licenseEvidence),
  );
  const licensing = usableMedia.length === 0 ? 0.3 : licensedOk ? 0.85 : 0.2;
  if (!licensedOk) reasons.push('media missing license/usage status');
  if (result.identity.employerAffiliated) {
    reasons.push('employer-affiliated assets — not personally owned; not an official employer site');
  }

  const parts = {
    identity: Number(identity.toFixed(3)),
    content: Number(content.toFixed(3)),
    brand: Number(brand.toFixed(3)),
    media: Number(mediaCapped.toFixed(3)),
    licensing: Number(licensing.toFixed(3)),
  };

  let score =
    parts.identity * 0.35 +
    parts.content * 0.2 +
    parts.brand * 0.2 +
    parts.media * 0.1 +
    parts.licensing * 0.15;

  const pass = verified && status === 'resolved' && hasDomain && score >= 0.45;
  if (!verified || status !== 'resolved') {
    score = Math.min(score, 0.39);
    reasons.push('failing gate: identity/domain not verified');
  }

  return {
    score: Number(score.toFixed(3)),
    pass,
    parts,
    reasons,
  };
}
