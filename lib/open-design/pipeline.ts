/**
 * Open Design creative pipeline — phase gates and Pulse emissions.
 */

import { emitPulseEvent } from '@/lib/pulse-bus';
import type {
  CreativeExperienceBrief,
  CreativeReviewStatus,
  OpenDesignPipelinePhase,
  StorySentence,
} from './types';

export const PIPELINE_PHASE_ORDER: OpenDesignPipelinePhase[] = [
  'executive-intelligence',
  'story-extraction',
  'creative-direction',
  'experience-design',
  'executive-review',
  'implementation',
];

export const CREATIVE_REVIEW_LABELS: Record<CreativeReviewStatus, string> = {
  'research-complete': 'Research Complete',
  'story-extracted': 'Story Extracted',
  'creative-dna-generated': 'Creative DNA Generated',
  'homepage-concept-ready': 'Homepage Concept Ready',
  'portal-concept-ready': 'Portal Concept Ready',
  'presentation-ready': 'Presentation Ready',
  'awaiting-executive-review': 'Awaiting Executive Review',
  approved: 'Approved',
  'revision-requested': 'Revision Requested',
};

/** Non-negotiable gate: no story sentence → no design. */
export function validateStoryGate(story: StorySentence): { ok: true } | { ok: false; reason: string } {
  const sentence = story.sentence.trim();
  if (!sentence) {
    return { ok: false, reason: 'Story sentence is required before any design work begins.' };
  }
  if (sentence.length < 24) {
    return { ok: false, reason: 'Story sentence is too short to anchor a creative direction.' };
  }
  return { ok: true };
}

export function reviewStatusForPhase(phase: OpenDesignPipelinePhase): CreativeReviewStatus {
  switch (phase) {
    case 'executive-intelligence':
      return 'research-complete';
    case 'story-extraction':
      return 'story-extracted';
    case 'creative-direction':
      return 'creative-dna-generated';
    case 'experience-design':
      return 'homepage-concept-ready';
    case 'executive-review':
      return 'awaiting-executive-review';
    case 'implementation':
      return 'approved';
    default:
      return 'research-complete';
  }
}

export async function emitOpenDesignPhase(
  brief: Pick<CreativeExperienceBrief, 'id' | 'organizationId' | 'phase' | 'reviewStatus'>,
  detail: string,
  tenantId?: string,
): Promise<void> {
  const typeMap: Partial<Record<OpenDesignPipelinePhase, string>> = {
    'story-extraction': 'open.design.story.extracted',
    'creative-direction': 'open.design.dna.generated',
    'experience-design': 'open.design.concept.ready',
    'executive-review': 'open.design.review.awaiting',
    implementation: 'open.design.handoff.cursor',
  };
  const eventType = typeMap[brief.phase];
  if (!eventType) return;

  await emitPulseEvent({
    type: eventType as 'open.design.story.extracted',
    product: 'ea-platform',
    title: CREATIVE_REVIEW_LABELS[brief.reviewStatus],
    detail,
    priority: brief.phase === 'executive-review' ? 'high' : 'medium',
    tenantId: tenantId ?? brief.organizationId,
    objectId: brief.id,
    href: '/admin/creative-studio',
    metadata: {
      openDesignPhase: brief.phase,
      reviewStatus: brief.reviewStatus,
    },
  });
}

export function advancePhase(
  current: OpenDesignPipelinePhase,
  brief: Pick<CreativeExperienceBrief, 'profile' | 'blockers'>,
): { next: OpenDesignPipelinePhase; blockers: string[] } {
  const blockers = [...brief.blockers];
  const storyCheck = validateStoryGate(brief.profile.story);

  if (current === 'executive-intelligence') {
    if (!storyCheck.ok) {
      blockers.push(storyCheck.reason);
      return { next: 'story-extraction', blockers };
    }
    return { next: 'story-extraction', blockers: [] };
  }

  if (current === 'story-extraction') {
    if (!storyCheck.ok) {
      return { next: 'story-extraction', blockers: [storyCheck.reason] };
    }
    return { next: 'creative-direction', blockers: [] };
  }

  if (current === 'creative-direction') {
    if (!brief.profile.creativeDna?.emotionalTone) {
      blockers.push('Creative DNA is incomplete.');
      return { next: 'creative-direction', blockers };
    }
    return { next: 'experience-design', blockers: [] };
  }

  if (current === 'experience-design') {
    return { next: 'executive-review', blockers: [] };
  }

  if (current === 'executive-review') {
    return { next: 'implementation', blockers: [] };
  }

  return { next: current, blockers };
}
