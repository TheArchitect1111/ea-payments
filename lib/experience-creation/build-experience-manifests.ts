/**
 * Experience manifests — composition plans for each creative premise.
 * Premises must produce substantially different page structures (not reordered clones).
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
    { sectionId: 'hero', composition: 'full_bleed_portrait_story' },
    { sectionId: 'path', composition: 'documentary_timeline' },
    { sectionId: 'proof', composition: 'accomplishment_sequence' },
    { sectionId: 'ecosystem', composition: 'organization_ecosystem' },
    { sectionId: 'invite', composition: 'immersive_section_transition' },
  ],
  'premise-editorial': [
    { sectionId: 'hero', composition: 'layered_text_photography' },
    { sectionId: 'profile', composition: 'asymmetric_editorial_grid' },
    { sectionId: 'media', composition: 'media_interview_rail' },
    { sectionId: 'statement', composition: 'large_typographic_statement' },
    { sectionId: 'invite', composition: 'invitation_commission' },
  ],
  'premise-intimate': [
    { sectionId: 'hero', composition: 'human_companion_centered' },
    { sectionId: 'mosaic', composition: 'editorial_image_mosaic' },
    { sectionId: 'work', composition: 'product_service_storytelling' },
    { sectionId: 'beliefs', composition: 'transform_split_editorial' },
    { sectionId: 'invite', composition: 'invitation_belonging' },
  ],
};

const PORTAL_FIRST_VIEWS: Record<string, string[]> = {
  'premise-cinematic': ['Continue the documentary', 'Chapters unlocked', 'Next scene'],
  'premise-editorial': ['Your brief', 'Saved notes', 'Editor’s next step'],
  'premise-intimate': ['Welcome back', 'A quiet next step', 'Messages'],
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
  const previewAssets = media.assets.filter(
    (a) => a.previewEligible && a.usageStatus !== 'rejected',
  );

  return content.premises.map((premise, index) => {
    const structure =
      PREMISE_COMPOSITIONS[premise.id] || PREMISE_COMPOSITIONS['premise-cinematic']!;
    const pageStructure = structure.map((row, i) => {
      const assigned =
        previewAssets.find((a) => a.assignedSections?.includes(row.sectionId)) ||
        previewAssets[i] ||
        previewAssets[0];
      const focalCss = assigned?.focal?.objectPosition;
      return {
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
        imageAssetId: assigned?.id,
        objectPosition: focalCss,
        ctaLabel: content.callsToAction[0],
      };
    });

    const primary = media.colors[0] || '#14110F';
    const accent = media.colors[1] || '#C4A574';

    const fullBleed =
      premise.id === 'premise-cinematic'
        ? 'edge-to-edge portrait storytelling hero; preserve face safe-region'
        : premise.id === 'premise-editorial'
          ? 'layered type over photography; asymmetric columns below'
          : 'companion-centered hero with mosaic continuity into portal';

    const manifest: ExperienceManifest = {
      ...createArtifactMeta({
        projectId,
        subjectIdentity: knowledge.verifiedIdentity.name,
        providerId: 'experience-creation-compiler',
        inputArtifactIds: [...content.inputArtifactIds],
        provenanceNotes: `Manifest for ${premise.name} — distinct composition grammar`,
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
        `Composition grammar: ${structure.map((s) => s.composition).join(' → ')}`,
        media.intentionalTypographyLed
          ? 'Typography-led hero until approved media arrives'
          : 'Preserve faces and focal points on assigned images via object-position',
        'Do not publish assets unless usageStatus=approved and media-usage gate passes',
      ],
      typographyScale: content.typographyDirection,
      colorTokens: { primary, accent, surface: '#F7F3EB' },
      fullBleedBehavior: fullBleed,
      navigation:
        premise.id === 'premise-editorial'
          ? ['Profile', 'Work', 'Continue']
          : premise.id === 'premise-intimate'
            ? ['Meet', 'Practice', 'Continue']
            : ['Story', 'Chapters', 'Continue'],
      ctaBehavior: {
        primaryLabel: content.callsToAction[0] || 'Continue',
        primaryHref: portalLoginHref,
        secondaryLabel: 'Return to concepts',
        secondaryHref: returnToConceptsHref,
      },
      motion:
        premise.id === 'premise-cinematic'
          ? 'Slow full-bleed dissolves between documentary chapters'
          : premise.id === 'premise-editorial'
            ? 'Staggered column reveals; type locks before imagery'
            : 'Soft companion fades; mosaic tiles settle last',
      portalSkin: {
        purpose: content.portalPurpose,
        firstView: PORTAL_FIRST_VIEWS[premise.id] || ['Where you are', 'What is next'],
        modules:
          premise.id === 'premise-editorial'
            ? ['Brief', 'Notes', 'Resources']
            : premise.id === 'premise-intimate'
              ? ['Welcome', 'Messages', 'Next step']
              : ['Progress', 'Chapters', 'Resources'],
        nextBestAction: content.callsToAction[0] || 'Continue the conversation',
      },
      websiteToPortalContinuity: content.websiteToPortalTransition,
      accessibilityRequirements: [
        'Text contrast AA',
        'Meaningful heading order',
        'CTA labels describe destination',
        'Images include attribution where required by license',
      ],
      evidenceReferences: knowledge.claims.slice(0, 8).map((c) => c.id),
      previewOnlyRestrictions: media.assets
        .filter((a) => a.previewEligible && !a.publicationEligible)
        .map(
          (a) =>
            `${a.id} is ${a.usageStatus || a.rightsStatus} — blocked from public publish`,
        ),
    };

    if (index === 1) manifest.colorTokens.accent = '#B9894D';
    if (index === 2) manifest.colorTokens.accent = '#A67C52';

    return manifest;
  });
}
