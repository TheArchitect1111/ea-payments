/**
 * Map Factory experience_concepts (+ creative_direction / preset fallback)
 * → OrganizationStoryInput for Website Director / Layout Composer.
 *
 * One concept = one director lens. Does not extend Experience Director orchestration.
 */
import { getExperienceLaunchPreset } from '@/lib/experience-launch-presets';
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
  sitePath?: string;
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
  const story = options.concept.story || creative?.story || {};
  const p = preset?.provision;

  const organizationName =
    creative?.organizationName?.trim() ||
    options.concept.organizationName?.trim() ||
    p?.organizationName?.trim() ||
    p?.businessName?.trim() ||
    'Client';

  const audience =
    story.audience?.trim() ||
    p?.primaryAudience?.trim() ||
    p?.whoTheyHelp?.trim() ||
    'People ready for a clear next step';

  const transformation =
    story.transformation?.trim() ||
    p?.whatChanges?.trim() ||
    `Help ${audience} move from uncertainty to a clear next step.`;

  const sentence =
    story.sentence?.trim() ||
    p?.story?.trim() ||
    p?.headline?.trim() ||
    `${organizationName} helps ${audience} find purpose and momentum.`;

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
    options.concept.rationale,
    websiteNotes ? `Lens craft: ${websiteNotes.slice(0, 180)}` : null,
  ]
    .filter((item): item is string => Boolean(item && String(item).trim()))
    .slice(0, 6);

  const beats = Array.isArray(creative?.homepageStoryBeats)
    ? creative!.homepageStoryBeats!
    : [];

  return {
    organizationName,
    industry: p?.industry,
    primaryAudience: audience,
    whoTheyAre:
      `${flavor.whoBias} ${p?.whoTheyAre || `${organizationName} — ${sentence}`}`.trim(),
    mission: `${flavor.missionBias} ${p?.mission || transformation}`.trim(),
    story: `${flavor.storyBias} ${sentence} ${options.concept.rationale || ''}`.trim(),
    whyTheyExist: p?.whyTheyExist || story.sentence || p?.mission,
    whoTheyHelp: p?.whoTheyHelp || audience,
    whyItMatters:
      p?.whyItMatters ||
      (Array.isArray(story.proofSignals) && story.proofSignals[0]
        ? story.proofSignals[0]
        : transformation),
    whatChanges: p?.whatChanges || transformation,
    differentiators: [flavor.differentiatorBias, ...differentiators].slice(0, 6),
    brandHeadline: p?.headline?.trim() || organizationName,
    brandSubhead: p?.tagline?.trim() || sentence.slice(0, 160),
    brandCta: p?.ctaLabel?.trim() || 'Begin',
    brandVoice: [flavor.voice, p?.brandVoice, creative?.visualDirection?.style]
      .filter(Boolean)
      .join(' '),
    primaryColor: flavor.colorShift.primary || p?.primaryColor,
    accentColor: flavor.colorShift.accent || p?.accentColor,
    portalLoginHref: options.portalLoginHref || p?.portalLoginHref,
    sitePath: options.sitePath || (options.portalSlug ? `/sites/${options.portalSlug}` : undefined),
    member: {
      whereYouAre: p?.member?.whereYouAre || flavor.memberWhere,
      whatNext: p?.member?.whatNext || flavor.memberNext,
      purpose: p?.member?.purpose || transformation,
      whatSuccessLooksLike:
        p?.member?.whatSuccessLooksLike || 'A clear next step and continuity from the public story.',
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
