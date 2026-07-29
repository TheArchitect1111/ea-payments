/**
 * Experience manifests — composition plans for each creative premise.
 */
import { createArtifactMeta } from '@/lib/experience-creation/meta';
import type {
  ContentCreativePack,
  ExperienceManifest,
  MediaBrandPack,
  SubjectKnowledgePack,
} from '@/lib/experience-creation/types';

const PREMISE_COMPOSITIONS: Record<
  string,
  Array<{ sectionId: string; composition: string }>
> = {
  'premise-cinematic': [
    { sectionId: 'hero', composition: 'human_threshold_bleed' },
    { sectionId: 'path', composition: 'reality_documentary_stat' },
    { sectionId: 'mission', composition: 'mission_plane_full' },
    { sectionId: 'proof', composition: 'impact_editorial_figures' },
    { sectionId: 'invite', composition: 'invitation_belonging' },
  ],
  'premise-editorial': [
    { sectionId: 'hero', composition: 'human_craft_detail' },
    { sectionId: 'mission', composition: 'mission_legacy_quiet' },
    { sectionId: 'process', composition: 'process_sparse_steps' },
    { sectionId: 'proof', composition: 'proof_trust_statement' },
    { sectionId: 'invite', composition: 'invitation_commission' },
  ],
  'premise-intimate': [
    { sectionId: 'hero', composition: 'human_companion_centered' },
    { sectionId: 'mission', composition: 'mission_plane_full' },
    { sectionId: 'change', composition: 'transform_split_editorial' },
    { sectionId: 'process', composition: 'process_sparse_steps' },
    { sectionId: 'invite', composition: 'invitation_belonging' },
  ],
};

export function buildExperienceManifests(input: {
  knowledge: SubjectKnowledgePack;
  media: MediaBrandPack;
  content: ContentCreativePack;
  projectId: string;
  returnToConceptsHref: string;
  portalLoginHref: string;
}): ExperienceManifest[] {
  const { knowledge, media, content, projectId, returnToConceptsHref, portalLoginHref } = input;
  const previewImage = media.assets.find((a) => a.previewEligible);

  return content.premises.map((premise, index) => {
    const structure =
      PREMISE_COMPOSITIONS[premise.id] || PREMISE_COMPOSITIONS['premise-cinematic']!;
    const pageStructure = structure.map((row, i) => ({
      sectionId: row.sectionId,
      composition: row.composition,
      headline:
        row.sectionId === 'hero'
          ? premise.heroHeadline
          : content.sectionHeadlines[i - 1] || premise.heroHeadline,
      body:
        row.sectionId === 'hero'
          ? premise.heroSupporting
          : content.sectionBodies[i - 1] || content.biography,
      imageAssetId: row.sectionId === 'hero' ? previewImage?.id : undefined,
      ctaLabel: content.callsToAction[0],
    }));

    const primary = media.colors[0] || '#14110F';
    const accent = media.colors[1] || '#C4A574';

    const manifest: ExperienceManifest = {
      ...createArtifactMeta({
        projectId,
        subjectIdentity: knowledge.verifiedIdentity.name,
        providerId: 'experience-creation-compiler',
        inputArtifactIds: [...content.inputArtifactIds],
        provenanceNotes: `Manifest for ${premise.name}`,
        confidence: content.confidence,
        completeness: content.completeness,
        validationOk: true,
      }),
      kind: 'experience_manifest',
      premiseId: premise.id,
      premiseName: premise.name,
      storySequence: premise.sectionSequence,
      pageStructure,
      layoutRules: [
        'Story before interface',
        'No EAFeatures card grids',
        'No fake statistics',
        media.intentionalTypographyLed
          ? 'Typography-led hero until approved media arrives'
          : 'Preserve faces and focal points on assigned images',
      ],
      typographyScale: content.typographyDirection,
      colorTokens: { primary, accent, surface: '#F7F3EB' },
      fullBleedBehavior:
        premise.id === 'premise-cinematic' ? 'full-bleed threshold hero' : 'contained editorial lead',
      navigation: ['Story', 'Work', 'Continue'],
      ctaBehavior: {
        primaryLabel: content.callsToAction[0] || 'Continue',
        primaryHref: portalLoginHref,
        secondaryLabel: 'Return to concepts',
        secondaryHref: returnToConceptsHref,
      },
      motion: content.motionDirection,
      portalSkin: {
        purpose: content.portalPurpose,
        firstView: ['Where you are', 'What happened', 'What is next'],
        modules: ['Progress', 'Messages', 'Resources'],
        nextBestAction: content.callsToAction[0] || 'Continue the conversation',
      },
      websiteToPortalContinuity: content.websiteToPortalTransition,
      accessibilityRequirements: [
        'Text contrast AA',
        'Meaningful heading order',
        'CTA labels describe destination',
      ],
      evidenceReferences: knowledge.claims.slice(0, 8).map((c) => c.id),
      previewOnlyRestrictions: media.assets
        .filter((a) => a.previewEligible && !a.publicationEligible)
        .map((a) => `${a.id} is preview-only (${a.rightsStatus})`),
    };

    // Diversity: shift accent slightly per premise without inventing a new brand.
    if (index === 1) manifest.colorTokens.accent = '#B9894D';
    if (index === 2) manifest.colorTokens.accent = '#A67C52';

    return manifest;
  });
}
