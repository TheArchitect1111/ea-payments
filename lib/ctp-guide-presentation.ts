/**
 * Client-facing presentation helpers for Guide home.
 * Formats existing GuideProgressView only — no second source of truth.
 */
import type { GuideMilestone, GuideProgressView } from '@/lib/ctp-guide-progress';

export type GuideStorySoFar = {
  previously: string | null;
  now: string;
  next: string;
  /** False when there is nothing meaningful beyond the opening outcome. */
  show: boolean;
};

export type GuideArrival = {
  line: string | null;
};

/** One enabling sentence from a completed milestone (project moment). */
export function projectMomentFromMilestone(milestone: GuideMilestone): string {
  const happened = milestone.whatHappened.replace(/\.\s*$/, '');
  const unlocked = milestone.whatItUnlocked.replace(/\.\s*$/, '');
  if (!unlocked) return `${happened}.`;
  // Longer whatHappened lines already carry the full moment.
  if (happened.length > 90) return `${happened}.`;
  return `${happened}. That work is now shaping ${unlocked}.`;
}

/**
 * Concise Previously / Now / Next from Guide data.
 * Collapses when the project has no completed milestones and idle (nothing new to narrate).
 */
export function buildGuideStorySoFar(guide: GuideProgressView): GuideStorySoFar {
  const last = guide.completed[guide.completed.length - 1] ?? null;
  const previously = last
    ? projectMomentFromMilestone(last)
    : null;

  const now = guide.behindTheScenes?.trim() || guide.summary;
  const next = guide.whatsNextStage
    ? `${guide.whatsNextCopy}`
    : guide.whatsNextCopy;

  const show = Boolean(previously) || !guide.nba.nothingRequired || guide.completed.length > 0;

  // Welcome with nothing completed and idle — opening outcome is enough
  if (!previously && guide.nba.nothingRequired && guide.currentStage === 'Welcome') {
    return { previously: null, now, next, show: false };
  }

  return {
    previously,
    now,
    next,
    show: show || Boolean(previously),
  };
}

/**
 * Arrival only when continuity is meaningful — never a generic hello.
 */
export function buildGuideArrival(
  guide: GuideProgressView,
  options?: { firstName?: string; celebration?: string | null },
): GuideArrival {
  const celebration = options?.celebration?.trim();
  if (celebration) {
    return { line: celebration };
  }

  const firstName = options?.firstName?.trim();
  const hasHistory = guide.completed.length > 0;
  const prefix = firstName ? `Welcome back, ${firstName}.` : 'Welcome back.';

  if (hasHistory && guide.nba.nothingRequired) {
    return {
      line: `${prefix} Everything is on track. We’ll let you know as soon as the next milestone is ready.`,
    };
  }

  if (hasHistory) {
    // Short continuity only — outcome sentence carries the project message.
    return { line: prefix };
  }

  if (firstName) {
    return {
      line: `Welcome, ${firstName}. You’re in the right place — we’ve already begun preparing what comes next.`,
    };
  }

  return {
    line: 'You’re in the right place. Your project is open, and we’re preparing what comes next.',
  };
}

/** Dominant outcome line — what EA is building / doing for them now. */
export function guideOutcomeSentence(guide: GuideProgressView): string {
  return guide.summary.trim();
}
