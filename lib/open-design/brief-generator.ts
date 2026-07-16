/**
 * Creative Brief Generator — translates Executive Intelligence into Open Design briefs.
 * Does not perform research; consumes outputs from PraisonAI / CTP / intake agents.
 */

import { extractCampaignBrief } from '@/lib/creative-studio/extract-brief';
import type { CampaignGoalId } from '@/lib/creative-studio/types';
import type { CtpSubmission } from '@/lib/ctp-submissions';
import { inferIndustryVertical, industryCreativeSeed } from './industry-library';
import { DEFAULT_ANTI_PATTERNS } from './creative-rules';
import type {
  CreativeDna,
  CreativeExperienceBrief,
  CreativeProfile,
  ExecutiveIntelligenceInput,
  ExperienceDeliverable,
  StorySentence,
} from './types';
import { reviewStatusForPhase, validateStoryGate } from './pipeline';

function newId(): string {
  return `od-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function extractStorySentence(input: ExecutiveIntelligenceInput): StorySentence {
  const candidates = [
    input.mission?.trim(),
    input.executiveSummary?.split(/[.!?]/)[0]?.trim(),
    input.discoveryAnswers && typeof input.discoveryAnswers.mission === 'string'
      ? String(input.discoveryAnswers.mission).trim()
      : '',
  ].filter(Boolean);

  return {
    sentence: candidates[0] ?? '',
    source: candidates[0] ? 'executive-intelligence' : undefined,
    validatedAt: candidates[0] ? new Date().toISOString() : undefined,
  };
}

function buildCreativeDna(profile: CreativeProfile, seedEditorial: CreativeDna['editorialStyle']): CreativeDna {
  return {
    emotionalTone: profile.creativeDna?.emotionalTone ?? 'Human, purposeful, confident — never corporate-generic.',
    photographyStyle:
      profile.photographyStyle ?? 'Documentary realism — real people, real environments, natural light.',
    typography: profile.typography ?? 'Editorial serif headline + clean humanist sans body.',
    scrollRhythm: profile.creativeDna?.scrollRhythm ?? 'Cinematic chapter beats — pause, reveal, breathe.',
    lighting: profile.creativeDna?.lighting ?? 'Warm key light, soft shadows, depth without gloss.',
    texture: profile.creativeDna?.texture ?? 'Tactile grain, paper, fabric — avoid flat SaaS gradients.',
    motion: profile.motion ?? 'Slow, intentional transitions — story-led, not decorative.',
    colorPsychology:
      profile.creativeDna?.colorPsychology ??
      'Anchor palette in mission and audience trust — not trend-chasing neon.',
    storyProgression:
      profile.creativeDna?.storyProgression ??
      'Possibility → proof → path → partnership (adapt per client story).',
    editorialStyle: profile.editorialStyle ?? seedEditorial,
    antiPatterns: profile.creativeDna?.antiPatterns ?? [...DEFAULT_ANTI_PATTERNS],
  };
}

function defaultDeliverables(storyBeat: string): ExperienceDeliverable[] {
  return [
    { kind: 'homepage', title: 'Homepage concept', storyBeat, status: 'pending' },
    { kind: 'portal', title: 'Portal experience', storyBeat: 'Continuity of story inside the logged-in world', status: 'pending' },
    { kind: 'dashboard', title: 'Dashboard layout', storyBeat: 'Operational clarity without killing narrative', status: 'pending' },
    { kind: 'landing-page', title: 'Campaign landing', storyBeat: 'Single-mission conversion moment', status: 'pending' },
    { kind: 'presentation', title: 'Executive presentation', storyBeat: 'Board-ready story for decision makers', status: 'pending' },
    { kind: 'mobile', title: 'Mobile experience', storyBeat: 'Same story, thumb-first', status: 'pending' },
    { kind: 'component-library', title: 'Component system', storyBeat: 'Reusable language of the brand world', status: 'pending' },
  ];
}

export function buildCreativeProfile(input: ExecutiveIntelligenceInput): CreativeProfile {
  const vertical = inferIndustryVertical(input.industry ?? input.organizationName);
  const seed = industryCreativeSeed(vertical);
  const story = extractStorySentence(input);

  return {
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    industryVertical: vertical,
    story,
    mission: input.mission ?? story.sentence,
    audience: input.audience ?? 'Primary stakeholders and the community served',
    differentiators: input.differentiators ?? [],
    photographyStyle: seed.photographyStyle,
    typography: seed.typography,
    colorPalette: seed.colorPalette,
    motion: seed.motion,
    editorialStyle: seed.editorialStyle,
    portalStyle: seed.portalStyle,
    presentationStyle: seed.presentationStyle,
    componentLanguage: seed.componentLanguage,
    visualMetaphors: seed.visualMetaphors,
    updatedAt: new Date().toISOString(),
  };
}

/** Generate Open Design brief from executive intelligence. Stops with blockers if story gate fails. */
export function generateCreativeExperienceBrief(
  input: ExecutiveIntelligenceInput,
  options?: { submissionId?: string; goalId?: CampaignGoalId },
): CreativeExperienceBrief {
  const profile = buildCreativeProfile(input);
  const storyGate = validateStoryGate(profile.story);
  const blockers: string[] = storyGate.ok ? [] : [storyGate.reason];

  let phase: CreativeExperienceBrief['phase'] = storyGate.ok
    ? 'creative-direction'
    : 'story-extraction';

  if (storyGate.ok) {
    profile.creativeDna = buildCreativeDna(profile, profile.editorialStyle ?? 'documentary');
    phase = 'experience-design';
  }

  const brief: CreativeExperienceBrief = {
    id: newId(),
    organizationId: input.organizationId,
    submissionId: options?.submissionId,
    phase,
    reviewStatus: reviewStatusForPhase(phase),
    profile,
    deliverables: storyGate.ok ? defaultDeliverables(profile.story.sentence) : [],
    blockers,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return brief;
}

export function executiveInputFromCtpSubmission(
  submission: CtpSubmission,
  organizationId: string,
): ExecutiveIntelligenceInput {
  return {
    organizationId,
    organizationName: submission.businessName,
    mission: submission.intakeAnalysis?.summary,
    audience: submission.contactName,
    differentiators: submission.desiredExperiences,
    executiveSummary: submission.intakeAnalysis?.summary,
    portalRecommendations: Array.isArray(submission.recommendations)
      ? submission.recommendations.map((r) =>
          typeof r === 'string' ? r : (r as { title?: string }).title ?? JSON.stringify(r),
        )
      : undefined,
    discoveryAnswers: submission.discoveryAnswers as Record<string, unknown> | undefined,
  };
}

/** Bridge: CTP submission → campaign brief (Creative Studio) + Open Design brief. */
export async function buildDualBriefFromCtp(
  submission: CtpSubmission,
  organizationId: string,
  story: string,
  goalId: CampaignGoalId = 'custom',
) {
  const campaignBrief = await extractCampaignBrief(story, goalId);
  const openDesignBrief = generateCreativeExperienceBrief(
    executiveInputFromCtpSubmission(submission, organizationId),
    { submissionId: submission.id, goalId },
  );
  return { campaignBrief, openDesignBrief };
}
