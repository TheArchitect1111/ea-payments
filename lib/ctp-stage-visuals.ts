/**
 * Presentation-only stage imagery for Client Experience.
 * Does not affect Guide intelligence, guideStage, or Project State.
 */
import type { GuideLifecycleStage } from '@/lib/ctp-guide-progress';

export type StageVisual = {
  src: string;
  alt: string;
  caption: string;
};

const STAGE_VISUALS: Record<GuideLifecycleStage, StageVisual> = {
  Welcome: {
    src: '/client-experience/welcome-possibility-strip.png',
    alt: 'Warm collage of people and possibility at the start of a project',
    caption: 'Your project is open',
  },
  Discovery: {
    src: '/client-experience/communication-understood.png',
    alt: 'Attentive conversation where someone feels truly understood',
    caption: 'Learning what matters',
  },
  Strategy: {
    src: '/client-experience/operations-harmony.png',
    alt: 'Orchestra in harmony — a metaphor for aligned priorities',
    caption: 'Priorities taking shape',
  },
  Proposal: {
    src: '/client-experience/story-brand-process.png',
    alt: 'Creative process collage for shaping a clear plan',
    caption: 'Your plan is ready',
  },
  Agreement: {
    src: '/client-experience/review-choose-time.png',
    alt: 'Calm desk moment for thoughtful confirmation',
    caption: 'Confirm so we can build',
  },
  Design: {
    src: '/client-experience/first-impression-entrance.png',
    alt: 'Warm entrance that invites trust and a strong first impression',
    caption: 'First directions underway',
  },
  Build: {
    src: '/client-experience/begin-life-freedom.png',
    alt: 'Emotionally charged collage of life, freedom, and purposeful living',
    caption: 'Crafting your presence',
  },
  Review: {
    src: '/client-experience/review-hero-welcome.png',
    alt: 'Welcoming review moment with care and clarity',
    caption: 'Your eye on the work',
  },
  Launch: {
    src: '/client-experience/journey-path.png',
    alt: 'A clear path forward through calm landscape',
    caption: 'Going live',
  },
  Care: {
    src: '/client-experience/continuity-portrait.png',
    alt: 'Portrait conveying continuity, care, and what happens next',
    caption: 'Still with you',
  },
};

export function stageVisualFor(stage: GuideLifecycleStage): StageVisual {
  return STAGE_VISUALS[stage] ?? STAGE_VISUALS.Welcome;
}
