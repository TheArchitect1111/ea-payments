/**
 * Map ResearchCrawlResult → SubjectKnowledgePack + MediaBrandPack enrichments.
 * Factory consumes structured packs — not raw crawl text.
 */
import { createArtifactMeta, scoreCompleteness } from '@/lib/experience-creation/meta';
import type {
  KnowledgeClaim,
  MediaAsset,
  MediaBrandPack,
  SubjectKnowledgePack,
} from '@/lib/experience-creation/types';
import type { FactoryProject } from '@/lib/factory-project-store';
import {
  scoreResearchCrawlCompleteness,
  type BrandProfile,
  type ResearchCrawlResult,
} from '@/lib/uxg/research/schemas';
import { assertsNoHotlink } from '@/lib/uxg/research/durable-assets';

function buildBrandProfile(result: ResearchCrawlResult): BrandProfile {
  if (result.brandProfile) return result.brandProfile;
  const logos = result.brandAssets.filter((a) => a.kind === 'logo' || a.kind === 'favicon');
  const colors = result.brandAssets.filter((a) => a.kind === 'color' || a.kind === 'css_variable');
  const fonts = result.brandAssets.filter((a) => a.kind === 'font_family');
  const languageSignals = result.brandAssets.filter((a) => a.kind === 'brand_language');

  const colorCounts = new Map<string, number>();
  for (const c of colors) {
    colorCounts.set(c.value.toLowerCase(), (colorCounts.get(c.value.toLowerCase()) || 0) + 1);
  }
  let authoritativeColor: string | undefined;
  let max = 1;
  for (const [value, n] of colorCounts) {
    if (n > max) {
      max = n;
      authoritativeColor = value;
    }
  }

  const consistentColors = colors.map((c) => ({
    ...c,
    consistentAcrossSources: (colorCounts.get(c.value.toLowerCase()) || 0) >= 2,
    confidence:
      (colorCounts.get(c.value.toLowerCase()) || 0) >= 2
        ? Math.max(c.confidence, 0.75)
        : Math.min(c.confidence, 0.45),
  }));

  // Only consistent / confident colors count toward authoritative palette.
  const confidentOnly = consistentColors.filter(
    (c) => c.consistentAcrossSources || c.confidence >= 0.6,
  );

  return {
    logos,
    colors: confidentOnly.length ? confidentOnly : consistentColors.filter((c) => c.confidence >= 0.6),
    fonts,
    languageSignals,
    overallConfidence: Math.min(
      1,
      (logos.length > 0 ? 0.35 : 0) +
        (authoritativeColor && (colorCounts.get(authoritativeColor) || 0) >= 2 ? 0.35 : 0) +
        (fonts.length ? 0.15 : 0) +
        (languageSignals.length ? 0.15 : 0),
    ),
    authoritativeColor:
      authoritativeColor && (colorCounts.get(authoritativeColor) || 0) >= 2
        ? authoritativeColor
        : undefined,
    authoritativeFont: fonts.find((f) => f.consistentAcrossSources)?.value,
    employerAffiliated: result.identity.employerAffiliated === true,
  };
}

export function mapCrawlToKnowledgePack(
  project: FactoryProject,
  result: ResearchCrawlResult,
): SubjectKnowledgePack {
  const claimCategory = (
    c: string,
  ): KnowledgeClaim['category'] => {
    if (c === 'identity' || c === 'organization' || c === 'audience' || c === 'other') return c;
    if (c === 'history') return 'timeline';
    if (c === 'role') return 'career';
    if (c === 'program' || c === 'service') return 'program';
    if (c === 'mission') return 'biography';
    return 'other';
  };

  const claims: KnowledgeClaim[] = result.evidence.map((e, i) => ({
    id: `crawl-claim-${i + 1}`,
    text: e.claim,
    status: e.independentlyCorroborated
      ? 'verified'
      : e.confidence >= 0.6
        ? 'supported_inference'
        : 'unknown',
    sourceUrls: [e.sourceUrl],
    category: claimCategory(e.category),
  }));

  const citations = result.evidence.map((e) => ({
    url: e.sourceUrl,
    title: e.pageTitle,
    usedFor: [e.category],
  }));

  const identityStatus =
    result.identity.identityStatus === 'resolved' && result.identity.identityVerified
      ? 'resolved'
      : result.identity.identityStatus === 'needs_clarification'
        ? 'ambiguous'
        : result.identity.officialDomains.length > 0 && result.evidence.length >= 1
          ? 'incomplete'
          : 'search_failed';

  const completeness = scoreResearchCrawlCompleteness(result);
  const orgs = [
    result.identity.organization,
    result.identity.employerAffiliated ? result.identity.employerDomain : null,
  ].filter((x): x is string => Boolean(x));

  const warnings = [
    ...result.diagnostics.errors.map((e) => `${e.code}: ${e.message}`),
    ...completeness.reasons,
  ];
  if (result.identity.employerAffiliated) {
    warnings.push(
      'Employer-affiliated brand/media — do not treat as personally owned; generated experience is not an official employer website.',
    );
  }
  if (result.identity.clarificationQuestion) {
    warnings.push(result.identity.clarificationQuestion);
  }

  return {
    ...createArtifactMeta({
      projectId: project.id,
      subjectIdentity: result.identity.canonicalName || project.client,
      providerId: 'uxg-research-crawl',
      inputArtifactIds: [],
      provenanceNotes: `Deep crawl via ${result.diagnostics.provider}; identityVerified=${result.identity.identityVerified}`,
      confidence: completeness.score,
      completeness: scoreCompleteness([
        Boolean(result.identity.canonicalName),
        result.identity.identityVerified,
        result.evidence.length > 0,
        completeness.pass,
      ]),
      warnings,
      validationOk: completeness.pass,
      validationReasons: completeness.reasons,
    }),
    kind: 'subject_knowledge_pack',
    verifiedIdentity: {
      name: result.identity.canonicalName || project.client,
      status: identityStatus,
      confidence: completeness.parts.identity,
      selectedUrl: result.identity.officialDomains[0]
        ? `https://${result.identity.officialDomains[0]}`
        : null,
      reason: result.identity.employerAffiliated
        ? `uxg-research:${result.diagnostics.provider}; employer-affiliated domain ${result.identity.employerDomain}`
        : `uxg-research:${result.diagnostics.provider}; verified=${result.identity.identityVerified}`,
    },
    alternativeIdentities: (result.identity.rejectedDomains || []).slice(0, 8).map((r) => ({
      name: r.domain,
      url: r.url,
      reason: r.reason,
    })),
    officialWebsite: result.identity.officialDomains[0]
      ? `https://${result.identity.officialDomains[0]}`
      : null,
    socialProfiles: result.identity.socialProfiles,
    locations: [...result.identity.geography, ...result.organization.locations].filter(Boolean),
    professionalRoles: result.identity.role ? [result.identity.role] : [],
    biography: result.organization.mission || result.evidence[0]?.claim || '',
    timeline: result.organization.history.map((h) => ({ label: 'History', detail: h })),
    education: [],
    careerHistory: [],
    organizations: orgs,
    accomplishments: [],
    programs: result.organization.services,
    currentWork: result.organization.services.slice(0, 5),
    audiences: result.organization.audiences,
    interviewsAndMedia: [],
    quotes: [],
    callsToAction: result.organization.callsToAction,
    citations,
    conflictingClaims: [],
    unsupportedClaims: [],
    unknowns: result.identity.clarificationQuestion ? [result.identity.clarificationQuestion] : [],
    claims,
  };
}

export function mapCrawlToMediaBrandPack(
  project: FactoryProject,
  result: ResearchCrawlResult,
  knowledge: SubjectKnowledgePack,
): MediaBrandPack {
  const brand = buildBrandProfile(result);
  const assets: MediaAsset[] = [];
  const seen = new Set<string>();

  for (const m of result.mediaAssets) {
    if (m.rejected) continue;
    const displayUrl = m.durableUrl || m.originalUrl;
    void assertsNoHotlink(displayUrl);
    const key = (m.perceptualHash || m.originalUrl.split('?')[0]!).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    assets.push({
      id: `crawl-media-${assets.length + 1}`,
      url: m.durableUrl || m.originalUrl,
      kind:
        m.relevanceCategory === 'logo'
          ? 'logo'
          : m.relevanceCategory === 'product'
            ? 'product'
            : m.relevanceCategory === 'portrait'
              ? 'portrait'
              : m.relevanceCategory === 'community'
                ? 'group'
                : m.relevanceCategory === 'environment'
                  ? 'location'
                  : 'other',
      width: m.width,
      height: m.height,
      qualityScore: 0.6,
      facePresent: typeof m.faceCount === 'number' ? m.faceCount > 0 : undefined,
      sourceUrl: m.pageUrl,
      rightsStatus: 'preview_only',
      previewEligible: Boolean(m.durableUrl) || true,
      publicationEligible: false,
      usageStatus: m.usageStatus === 'user_supplied' ? 'user_supplied' : m.usageStatus,
      title: m.altText || m.caption,
      attribution: m.attribution,
      license: m.licenseEvidence,
      mediaProvider: 'uxg-research-crawl',
      checksum: m.perceptualHash,
      format: m.mimeType,
    });
  }

  for (const logo of brand.logos) {
    const key = logo.value.split('?')[0]!.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    assets.unshift({
      id: `crawl-logo-${assets.length + 1}`,
      url: logo.value,
      kind: 'logo',
      qualityScore: logo.confidence,
      sourceUrl: logo.sourceUrl,
      rightsStatus: 'preview_only',
      previewEligible: true,
      publicationEligible: false,
      usageStatus: 'preview_only',
      mediaProvider: 'uxg-research-brand',
    });
  }

  const colors = brand.colors
    .filter((c) => c.consistentAcrossSources || c.confidence >= 0.6)
    .map((c) => c.value)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 8);

  const mediaWarnings: string[] = [];
  if (result.identity.employerAffiliated) {
    mediaWarnings.push(
      'Employer-affiliated logos/colors/imagery — not personally owned; experience is not an official employer website.',
    );
  }

  return {
    ...createArtifactMeta({
      projectId: project.id,
      subjectIdentity: knowledge.verifiedIdentity.name,
      providerId: 'uxg-research-crawl',
      inputArtifactIds: knowledge.inputArtifactIds || [],
      provenanceNotes:
        'Crawl brand/media — preview_only until ownership/permission confirmed; no hotlink publish',
      confidence: assets.length ? 0.55 : 0.2,
      completeness: scoreCompleteness([
        assets.length > 0,
        colors.length > 0,
        assets.some((a) => a.kind === 'logo'),
        !result.identity.employerAffiliated || mediaWarnings.length > 0,
      ]),
      warnings: mediaWarnings,
      validationOk: assets.length > 0,
    }),
    kind: 'media_brand_pack',
    assets,
    colors,
    typographyClues: brand.fonts.map((f) => f.value),
    brandPatterns: brand.languageSignals.map((l) => l.value).slice(0, 12),
    missingMediaRequests:
      assets.length < 2 ? ['Need additional approved brand or subject media'] : [],
    intentionalTypographyLed:
      brand.fonts.length > 0 && assets.filter((a) => a.kind === 'logo').length === 0,
  };
}

export { buildBrandProfile };
