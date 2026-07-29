/**
 * Map Factory experience_concepts (+ creative_direction / preset fallback)
 * → OrganizationStoryInput for Website Director / Layout Composer.
 *
 * One concept = one director lens. Does not extend Experience Director orchestration.
 */
import { getExperienceLaunchPreset } from '@/lib/experience-launch-presets';
import {
  scrubForbiddenPublicCopy,
} from '@/lib/factory-forbidden-copy.mjs';
import type { ContentPackage } from '@/lib/factory-content-package';
import type { OrganizationStoryInput } from '@/lib/website-director';

export type ExperienceConceptLens = 'cinematic' | 'editorial' | 'intimate';

export type FactoryCreativeDirectionData = {
  organizationName?: string | null;
  story?: {
    sentence?: string;
    audience?: string;
    transformation?: string;
    proofSignals?: string[];
  };
  visualDirection?: {
    style?: string;
    photography?: string;
    typography?: string;
    composition?: string;
    motion?: string;
  };
  homepageStoryBeats?: string[];
  portalContinuity?: {
    purpose?: string;
    firstView?: string[];
  };
  antiPatterns?: string[];
  experiencePrinciples?: string[];
  publishingSafety?: unknown;
};

export type FactoryExperienceConcept = {
  id: string;
  name: string;
  rationale?: string;
  organizationName?: string | null;
  story?: FactoryCreativeDirectionData['story'];
  website?: {
    composition?: string;
    imageBehavior?: string;
    typeBehavior?: string;
    motion?: string;
  };
  portal?: {
    composition?: string;
    tone?: string;
  };
  sourceCreativeDirectionId?: string | null;
  publishingSafety?: unknown;
};

export type ConceptToDirectorOptions = {
  concept: FactoryExperienceConcept;
  creativeDirection?: FactoryCreativeDirectionData | null;
  /** Prefer Amanda golden-path preset when client matches / slug known. */
  presetId?: string;
  portalSlug?: string;
  portalLoginHref?: string;
  /**
   * Public site path only when provisioned. For Factory previews, pass the
   * Quick Launch return URL so CTAs never hit unpublished /sites/**.
   */
  sitePath?: string;
  /** Structured research→copy package; preferred over thin creative_direction. */
  contentPackage?: ContentPackage | null;
  /** Preview-eligible hero image URL from media_brand_pack. */
  heroImageUrl?: string;
};

const LENS_FLAVOR: Record<
  ExperienceConceptLens,
  {
    voice: string;
    colorShift: { primary: string; accent: string };
    memberWhere: string;
    memberNext: string;
    /** Injected into story corpus so Website Director classifies / scenes diverge. */
    storyBias: string;
    whoBias: string;
    missionBias: string;
    differentiatorBias: string;
  }
> = {
  cinematic: {
    voice:
      'Documentary, human, cinematic — story before interface; lived proof over advertised claims.',
    colorShift: { primary: '#14110F', accent: '#C4A574' },
    memberWhere: 'Your story is underway — here is where you stand.',
    memberNext: 'Take the next quiet step the narrative is asking for.',
    storyBias:
      'A cinematic documentary of belonging — America needs these lived human stories, advocacy with dignity, not a software pitch.',
    whoBias:
      'A community-rooted advocate who walks beside people and lets proof feel lived rather than advertised.',
    missionBias:
      'Stand with people until their story is visible — belonging, voice, and a calm next chapter.',
    differentiatorBias: 'Documentary photography, full-bleed threshold moments, human evidence sequences',
  },
  editorial: {
    voice:
      'Warm, elevated, editorial — publication-scale type, annotated evidence, journal continuity.',
    colorShift: { primary: '#17130F', accent: '#B9894D' },
    memberWhere: 'Your briefing cover is ready.',
    memberNext: 'Open the chapter that matches what you want to create next.',
    storyBias:
      'An editorial journal of craft and education — annotated evidence, magazine chapters, teach with clarity and legacy.',
    whoBias:
      'An educator and craftsman who publishes guidance as chapters: evidence, voice, and a signature close.',
    missionBias:
      'Turn expertise into a publication people trust — learn, master, and keep going.',
    differentiatorBias: 'Asymmetric editorial lead, pull quotes, annotated proof, journal continuity',
  },
  intimate: {
    voice:
      'Intimate, relationship-first, studio-warm — trust and personal invitation over software chrome.',
    colorShift: { primary: '#1A1512', accent: '#A67C52' },
    memberWhere: 'Welcome back to your private studio.',
    memberNext: 'One next step — then we walk it together.',
    storyBias:
      'An intimate studio of care and craft — heal, nurture, guide beside you; handmade trust, not dashboard chrome.',
    whoBias:
      'A caregiver and guide in a private atelier — warm portraits, hands-at-work, relationship first.',
    missionBias:
      'Walk beside each person until the path feels safe, clear, and theirs again.',
    differentiatorBias: 'Portrait-led invitation, tactile studio moments, one trusted next step',
  },
};

export function detectConceptLens(concept: {
  name?: string;
  id?: string;
}): ExperienceConceptLens {
  const hay = `${concept.name || ''} ${concept.id || ''}`.toLowerCase();
  if (hay.includes('editorial') || hay.includes('journal') || /concept-b\b/.test(hay)) {
    return 'editorial';
  }
  if (hay.includes('intimate') || hay.includes('studio') || /concept-c\b/.test(hay)) {
    return 'intimate';
  }
  return 'cinematic';
}

function pickPreset(options: ConceptToDirectorOptions) {
  if (options.presetId) return getExperienceLaunchPreset(options.presetId);
  const org = (
    options.creativeDirection?.organizationName ||
    options.concept.organizationName ||
    ''
  )
    .trim()
    .toLowerCase();
  const slug = (options.portalSlug || '').trim().toLowerCase();
  if (org.includes('amanda') || slug.includes('amanda')) {
    return getExperienceLaunchPreset('amanda-catherine-editorial');
  }
  return undefined;
}

/**
 * Build Website Director input for one Factory concept lens.
 */
export function conceptToOrganizationStoryInput(
  options: ConceptToDirectorOptions,
): OrganizationStoryInput {
  const lens = detectConceptLens(options.concept);
  const flavor = LENS_FLAVOR[lens];
  const preset = pickPreset(options);
  const creative = options.creativeDirection;
  const pack = options.contentPackage;
  const lensCopy = pack?.lenses?.[lens];
  const story = options.concept.story || creative?.story || {};
  const p = preset?.provision;

  const organizationName =
    scrubForbiddenPublicCopy(pack?.name) ||
    scrubForbiddenPublicCopy(creative?.organizationName) ||
    scrubForbiddenPublicCopy(options.concept.organizationName) ||
    scrubForbiddenPublicCopy(p?.organizationName) ||
    scrubForbiddenPublicCopy(p?.businessName) ||
    'Client';

  const audience =
    scrubForbiddenPublicCopy(pack?.audience) ||
    scrubForbiddenPublicCopy(story.audience) ||
    scrubForbiddenPublicCopy(p?.primaryAudience) ||
    scrubForbiddenPublicCopy(p?.whoTheyHelp) ||
    'People ready for a clear next step';

  const transformation =
    scrubForbiddenPublicCopy(lensCopy?.aboutBody?.slice(0, 220)) ||
    scrubForbiddenPublicCopy(story.transformation) ||
    scrubForbiddenPublicCopy(p?.whatChanges) ||
    scrubForbiddenPublicCopy(pack?.centralStory?.slice(0, 220)) ||
    `Help ${audience} move with clarity and purpose.`;

  const sentence =
    scrubForbiddenPublicCopy(lensCopy?.heroSupporting) ||
    scrubForbiddenPublicCopy(story.sentence) ||
    scrubForbiddenPublicCopy(pack?.positioning) ||
    scrubForbiddenPublicCopy(p?.story) ||
    scrubForbiddenPublicCopy(p?.headline) ||
    `${organizationName} — ${scrubForbiddenPublicCopy(pack?.centralStory)?.slice(0, 120) || 'a researched public story.'}`;

  const websiteNotes = [
    options.concept.website?.composition,
    options.concept.website?.imageBehavior,
    options.concept.website?.typeBehavior,
    options.concept.website?.motion,
    creative?.visualDirection?.style,
    creative?.visualDirection?.photography,
  ]
    .filter(Boolean)
    .join(' · ');

  const differentiators = [
    ...(Array.isArray(p?.differentiators) ? p!.differentiators! : []),
    ...(Array.isArray(story.proofSignals) ? story.proofSignals.slice(0, 3) : []),
    ...(pack?.accomplishments || []).slice(0, 3),
    ...(pack?.claims || []).slice(0, 3).map((c) => c.text),
    options.concept.rationale,
    websiteNotes ? `Lens craft: ${websiteNotes.slice(0, 180)}` : null,
  ]
    .map((item) => (typeof item === 'string' ? scrubForbiddenPublicCopy(item) : undefined))
    .filter((item): item is string => Boolean(item && String(item).trim()))
    .slice(0, 6);

  const beats = Array.isArray(creative?.homepageStoryBeats)
    ? creative!.homepageStoryBeats!
    : [];
  void beats;

  const brandHeadline =
    scrubForbiddenPublicCopy(lensCopy?.heroHeadline) ||
    scrubForbiddenPublicCopy(p?.headline) ||
    organizationName;
  const brandSubhead =
    scrubForbiddenPublicCopy(lensCopy?.heroSupporting) ||
    scrubForbiddenPublicCopy(p?.tagline) ||
    sentence.slice(0, 160);
  const brandCta =
    scrubForbiddenPublicCopy(lensCopy?.ctaLabel) ||
    scrubForbiddenPublicCopy(p?.ctaLabel) ||
    'Begin';

  // Preview-safe path: never invent unpublished /sites/** links here.
  const sitePath = options.sitePath;

  const hasEvidencePack = Boolean(pack?.biography || pack?.centralStory);
  const whoTheyAre = hasEvidencePack
    ? scrubForbiddenPublicCopy(pack?.biography) || `${organizationName} — ${sentence}`
    : scrubForbiddenPublicCopy(
        `${flavor.whoBias} ${pack?.biography || p?.whoTheyAre || `${organizationName} — ${sentence}`}`,
      ) || `${organizationName} — ${sentence}`;
  const mission = hasEvidencePack
    ? scrubForbiddenPublicCopy(pack?.centralStory) ||
      scrubForbiddenPublicCopy(pack?.positioning) ||
      transformation
    : scrubForbiddenPublicCopy(
        `${flavor.missionBias} ${p?.mission || pack?.centralStory || transformation}`,
      ) || transformation;
  const storyText = hasEvidencePack
    ? scrubForbiddenPublicCopy(
        `${sentence} ${options.concept.rationale || ''}`.trim(),
      ) || sentence
    : scrubForbiddenPublicCopy(
        `${flavor.storyBias} ${sentence} ${options.concept.rationale || ''}`,
      ) || sentence;

  return {
    organizationName,
    industry: p?.industry,
    primaryAudience: audience,
    whoTheyAre,
    mission,
    story: storyText,
    whyTheyExist:
      scrubForbiddenPublicCopy(p?.whyTheyExist) ||
      scrubForbiddenPublicCopy(pack?.positioning) ||
      scrubForbiddenPublicCopy(story.sentence) ||
      scrubForbiddenPublicCopy(p?.mission) ||
      sentence,
    whoTheyHelp: scrubForbiddenPublicCopy(p?.whoTheyHelp) || audience,
    whyItMatters:
      scrubForbiddenPublicCopy(p?.whyItMatters) ||
      scrubForbiddenPublicCopy(pack?.claims?.[0]?.text) ||
      (Array.isArray(story.proofSignals) && story.proofSignals[0]
        ? scrubForbiddenPublicCopy(story.proofSignals[0])
        : undefined) ||
      transformation,
    whatChanges: scrubForbiddenPublicCopy(p?.whatChanges) || transformation,
    // Never inject LENS_FLAVOR.differentiatorBias (internal craft notes) into public copy.
    differentiators: differentiators
      .map((d) => scrubForbiddenPublicCopy(d))
      .filter((d): d is string => Boolean(d))
      .slice(0, 6),
    brandHeadline,
    brandSubhead,
    brandCta,
    brandVoice: [flavor.voice, p?.brandVoice]
      .filter(Boolean)
      .join(' '),
    primaryColor: flavor.colorShift.primary || p?.primaryColor,
    accentColor: flavor.colorShift.accent || p?.accentColor,
    portalLoginHref: options.portalLoginHref || p?.portalLoginHref,
    sitePath,
    heroImageUrl: options.heroImageUrl,
    member: {
      whereYouAre: p?.member?.whereYouAre || flavor.memberWhere,
      whatNext: p?.member?.whatNext || flavor.memberNext,
      purpose:
        scrubForbiddenPublicCopy(lensCopy?.portalPurpose) ||
        scrubForbiddenPublicCopy(p?.member?.purpose) ||
        scrubForbiddenPublicCopy(pack?.lenses?.[lens]?.portalPurpose) ||
        transformation,
      whatSuccessLooksLike:
        p?.member?.whatSuccessLooksLike ||
        'A clear next step and continuity from the public story.',
    },
  };
}

/** Theme id for preview / publish continuity (editorial lens → amanda-editorial when Amanda). */
export function themeIdForConceptLens(
  lens: ExperienceConceptLens,
  portalSlug?: string,
): string {
  const slug = (portalSlug || '').toLowerCase();
  if (lens === 'editorial' || slug.includes('amanda')) {
    return 'amanda-editorial';
  }
  return 'ea-default-theme';
}

export function conceptToProvisionFields(
  options: ConceptToDirectorOptions,
): {
  lens: ExperienceConceptLens;
  organization: OrganizationStoryInput;
  themeId: string;
  primaryColor: string;
  accentColor: string;
} {
  const lens = detectConceptLens(options.concept);
  const organization = conceptToOrganizationStoryInput(options);
  const themeId = themeIdForConceptLens(lens, options.portalSlug);
  return {
    lens,
    organization,
    themeId,
    primaryColor: organization.primaryColor || '#17130F',
    accentColor: organization.accentColor || '#B9894D',
  };
}
