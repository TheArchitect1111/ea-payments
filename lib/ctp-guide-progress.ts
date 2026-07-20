/**
 * Dynamic Guide Intelligence — Guide Operating System.
 * Presentation logic only. No auth, routing, or provisioning changes.
 */
import type { CtpPortalStatusView } from '@/lib/ctp-portal-status';
import {
  designStudioPath,
  opportunityDashboardPath,
  opportunityReviewPath,
  portalCtpPath,
} from '@/lib/ctp-opportunity-routes';
import {
  GUIDE_LIFECYCLE_STAGES,
  resolveGuideDocumentsAvailable,
  resolveGuideStages,
  type GuideLifecycleStage,
} from '@/lib/ctp-guide-stage-engine';

export { GUIDE_LIFECYCLE_STAGES, type GuideLifecycleStage };

export type GuideStageNarrative = {
  headline: string;
  summary: string;
  behindTheScenes: string;
  expectedDuration: string;
  commonQuestions: { question: string; answer: string }[];
  completionHint: string;
  transitionToNext: string;
};

export type GuideMilestone = {
  stage: GuideLifecycleStage;
  title: string;
  whatHappened: string;
  whyItMatters: string;
  whatItUnlocked: string;
  whatHappensNext: string;
};

export type GuideNbaKind =
  | 'blocking'
  | 'meeting'
  | 'approval'
  | 'upload'
  | 'payment'
  | 'information'
  | 'review'
  | 'celebrate'
  | 'wait';

export type GuideNextBestAction = {
  kind: GuideNbaKind;
  label: string;
  href?: string;
  why: string;
  duration: string;
  after: string;
  external?: boolean;
  /** When true, client owes nothing — Guide reassures instead of directing. */
  nothingRequired: boolean;
};

export type GuideDocumentLink = {
  label: string;
  href?: string;
};

export type GuideProgressView = {
  businessName: string;
  currentStage: GuideLifecycleStage;
  headline: string;
  summary: string;
  stageWhy: string;
  estimatedCompletion?: string;
  confidenceMessage: string;
  /** Warm celebration line when a major milestone is current. */
  celebrationMessage?: string;
  behindTheScenes: string;
  commonQuestions: { question: string; answer: string }[];
  whatsNextStage: GuideLifecycleStage | null;
  whatsNextCopy: string;
  completed: GuideMilestone[];
  /** Auto-grown timeline from completed stages (canonical Guide language). */
  timeline: GuideMilestone[];
  documentsAvailable: GuideDocumentLink[];
  nba: GuideNextBestAction;
  showDesignStudio: boolean;
};

/** Full stage catalog — source of truth for client-facing Guide copy. */
export const GUIDE_STAGE_NARRATIVES: Record<GuideLifecycleStage, GuideStageNarrative> = {
  Welcome: {
    headline: 'Welcome — your project is open',
    summary:
      'You’re in the right place. We’ve opened your project home and connected you with your experience.',
    behindTheScenes:
      'Our team is gathering what we already know about your business and preparing a clear path forward.',
    expectedDuration: 'Usually complete on your first visit',
    commonQuestions: [
      {
        question: 'Do I need to do anything right now?',
        answer: 'Start with Your Journey, then return here — we’ll always show one clear next step.',
      },
      {
        question: 'Is my project already underway?',
        answer: 'Yes. Opening your portal means we’ve begun organizing your experience.',
      },
    ],
    completionHint: 'You’ve entered your project home.',
    transitionToNext:
      'Next is Discovery — we learn how your business works so recommendations fit real life.',
  },
  Discovery: {
    headline: 'Discovery — we’re learning your business',
    summary:
      'We’re studying what you shared and how you show up today so every next step is relevant.',
    behindTheScenes:
      'Our team is reviewing your answers and your public presence to understand opportunities and constraints.',
    expectedDuration: 'Often a few days, depending on how much context we already have',
    commonQuestions: [
      {
        question: 'Why does this take time?',
        answer: 'Thoughtful Discovery prevents wasted work later — we’re aiming for fit, not speed alone.',
      },
      {
        question: 'Will you ask me more questions?',
        answer: 'Only if something important is missing. We’ll ask clearly when we need you.',
      },
    ],
    completionHint: 'We understand enough to recommend a path.',
    transitionToNext:
      'Next is Strategy — we’ll turn Discovery into priorities you can recognize and act on.',
  },
  Strategy: {
    headline: 'Strategy — your priorities are taking shape',
    summary:
      'We’re defining what matters most so your plan focuses on capacity, clarity, and momentum.',
    behindTheScenes:
      'Our team is organizing recommendations and preparing a conversation that keeps everyone aligned.',
    expectedDuration: 'Typically several days, including time for a strategy conversation',
    commonQuestions: [
      {
        question: 'Do we need a meeting?',
        answer: 'A short strategy conversation often saves weeks of misalignment — we’ll invite you when it’s time.',
      },
      {
        question: 'Will this feel salesy?',
        answer: 'No. Strategy is about clarity and fit — not pressure.',
      },
    ],
    completionHint: 'Priorities are clear enough to propose a plan.',
    transitionToNext:
      'Next is Proposal — you’ll see the plan and investment in one place.',
  },
  Proposal: {
    headline: 'Proposal — your plan is ready to review',
    summary:
      'Your plan and investment are available so you can decide with full context and no guesswork.',
    behindTheScenes:
      'We’ve packaged the recommended path so you can review it calmly and ask questions.',
    expectedDuration: 'Review usually takes 10–15 minutes when you’re ready',
    commonQuestions: [
      {
        question: 'What if I have questions?',
        answer: 'Message your team or schedule a conversation — we’ll walk through anything unclear.',
      },
      {
        question: 'Am I locking anything in by opening it?',
        answer: 'Opening the proposal is for understanding. Confirmation comes next, when you’re ready.',
      },
    ],
    completionHint: 'You’ve received a clear plan to review.',
    transitionToNext:
      'Next is Agreement — confirmation lets us begin Design with confidence.',
  },
  Agreement: {
    headline: 'Agreement — confirm so we can build',
    summary:
      'We’re ready to move into Design as soon as you confirm. Nothing proceeds without your go-ahead.',
    behindTheScenes:
      'Our team is prepared to start Design the moment you’re confirmed — no idle waiting on our side.',
    expectedDuration: 'Usually same day once you’re ready to confirm',
    commonQuestions: [
      {
        question: 'What happens after I confirm?',
        answer: 'We enter Design and ask only for the brand details that unlock first concepts.',
      },
      {
        question: 'Can I still ask questions?',
        answer: 'Always. Confirmation means alignment — not silence.',
      },
    ],
    completionHint: 'You’re confirmed and we can build with clarity.',
    transitionToNext:
      'Next is Design — a few brand choices shape your first directions.',
  },
  Design: {
    headline: 'Design — your brand shapes the first directions',
    summary:
      'This is where your voice, look, and offers guide the concepts we’ll create for you.',
    behindTheScenes:
      'As soon as we have what we need from you, our design team prepares first concepts for review.',
    expectedDuration: 'Often 1–2 weeks, depending on how quickly brand details arrive',
    commonQuestions: [
      {
        question: 'What do you need from me?',
        answer: 'Brand basics — logo, colors, voice, and inspiration. We’ll show exactly what’s still needed.',
      },
      {
        question: 'What if I don’t have a full brand?',
        answer: 'That’s okay. Share what you have — we can help fill gaps without slowing the project.',
      },
    ],
    completionHint: 'Brand direction is clear enough to create concepts.',
    transitionToNext:
      'Next is Build — we craft your website and portal from the direction you chose.',
  },
  Build: {
    headline: 'Build — we’re crafting your presence',
    summary:
      'Nothing major is needed from you right now. Our team is assembling your website and portal.',
    behindTheScenes:
      'Designers and builders are connecting your pages, content structure, and portal experience.',
    expectedDuration: 'Typically 1–3 weeks, depending on scope and feedback loops',
    commonQuestions: [
      {
        question: 'Should I check in every day?',
        answer: 'No. We’ll notify you when it’s your turn. Checking Progress here is enough.',
      },
      {
        question: 'What if I think of new content?',
        answer: 'Message your team anytime — useful input is always welcome.',
      },
    ],
    completionHint: 'A reviewable version of your presence is ready.',
    transitionToNext:
      'Next is Review — you’ll look closely and tell us what to refine.',
  },
  Review: {
    headline: 'Review — your eye on the work',
    summary:
      'Please look at what’s ready and share clear feedback so we can refine with confidence.',
    behindTheScenes:
      'We’re preparing your preview and organizing feedback so refinements stay focused.',
    expectedDuration: 'Feedback often takes 15–30 minutes; refinements follow shortly after',
    commonQuestions: [
      {
        question: 'What kind of feedback helps most?',
        answer: 'Specific notes — what feels right, what feels off, and what must change before launch.',
      },
      {
        question: 'Can we do more than one round?',
        answer: 'Yes, within the agreed plan. We’ll keep the path clear so review doesn’t stall.',
      },
    ],
    completionHint: 'Feedback is in and refinements are clear.',
    transitionToNext:
      'Next is Launch — we finish checks and make your presence live.',
  },
  Launch: {
    headline: 'Launch — you’re going live',
    summary:
      'This is the moment your presence meets the world. We’ll help you share it with confidence.',
    behindTheScenes:
      'We’re completing final checks so your site is ready to open and share.',
    expectedDuration: 'Usually a few days once Review is complete',
    commonQuestions: [
      {
        question: 'What do I do on launch day?',
        answer: 'Open your live site, share it, and tell us if anything needs a quick fix.',
      },
      {
        question: 'Is support over after launch?',
        answer: 'No. Care continues — we’re still with you.',
      },
    ],
    completionHint: 'Your presence is live.',
    transitionToNext:
      'Next is Care — ongoing support, questions, and thoughtful next steps.',
  },
  Care: {
    headline: 'Care — we’re still with you',
    summary:
      'Your project is live. Reach out anytime for questions, refinements, or what comes next.',
    behindTheScenes:
      'We’re available for support and watching for anything that needs a gentle follow-up.',
    expectedDuration: 'Ongoing — at your pace',
    commonQuestions: [
      {
        question: 'How do I get help?',
        answer: 'Use Support or Messages — a real person on your team will respond.',
      },
      {
        question: 'What if we want to grow further?',
        answer: 'Tell us your goal. We’ll recommend a calm next chapter when you’re ready.',
      },
    ],
    completionHint: 'You’re in ongoing care with your team.',
    transitionToNext: 'You’re in Care — we’ll keep supporting you as needs arise.',
  },
};

type NbaCandidate = GuideNextBestAction & { priority: number };

function designStillNeeded(view: CtpPortalStatusView): boolean {
  return view.designStudio.some((item) => item.status === 'needed');
}

function celebrationForStage(
  stage: GuideLifecycleStage,
  nba: GuideNextBestAction,
): string | undefined {
  if (nba.kind === 'celebrate') {
    if (stage === 'Care' || stage === 'Launch') {
      return 'Project Launched — your presence is live. Take a moment, then use Care anytime.';
    }
    return 'A real milestone — take a moment, then we’ll show what’s next.';
  }
  return undefined;
}

function milestoneTitle(stage: GuideLifecycleStage): string {
  const map: Record<GuideLifecycleStage, string> = {
    Welcome: 'Welcome Complete',
    Discovery: 'Discovery Complete',
    Strategy: 'Strategy Complete',
    Proposal: 'Proposal Delivered',
    Agreement: 'Agreement Signed',
    Design: 'Design Complete',
    Build: 'Build Complete',
    Review: 'Review Complete',
    Launch: 'Launch Complete',
    Care: 'Care Underway',
  };
  return map[stage];
}

function buildMilestone(
  stage: GuideLifecycleStage,
  nextStage: GuideLifecycleStage | null,
): GuideMilestone {
  const narrative = GUIDE_STAGE_NARRATIVES[stage];
  const nextName = nextStage ?? 'Care';
  const details: Record<
    GuideLifecycleStage,
    Pick<GuideMilestone, 'whatHappened' | 'whyItMatters' | 'whatItUnlocked'>
  > = {
    Welcome: {
      whatHappened: 'Your project home opened and you were connected to your experience.',
      whyItMatters: 'You always have one clear place to see where things stand.',
      whatItUnlocked: 'Discovery — learning your business with context.',
    },
    Discovery: {
      whatHappened: 'We captured what matters about your business and how you show up today.',
      whyItMatters: 'Recommendations stay grounded in your real operations.',
      whatItUnlocked: 'Strategy — priorities worth your time.',
    },
    Strategy: {
      whatHappened: 'We defined the priorities that create the most capacity for you.',
      whyItMatters: 'You avoid scattered work and stay focused on what moves the needle.',
      whatItUnlocked: 'Proposal — a clear plan and investment.',
    },
    Proposal: {
      whatHappened: 'Your plan and investment details were delivered for review.',
      whyItMatters: 'You can decide with clarity instead of guessing.',
      whatItUnlocked: 'Agreement — confirmation to begin Design.',
    },
    Agreement: {
      whatHappened: 'You’re confirmed so we can build with confidence.',
      whyItMatters: 'Momentum stays intact and scope stays clear.',
      whatItUnlocked: 'Design — brand direction and first concepts.',
    },
    Design: {
      whatHappened: 'Brand direction and materials are in place for concepts.',
      whyItMatters: 'What we build will look and sound like you.',
      whatItUnlocked: 'Build — crafting your website and portal.',
    },
    Build: {
      whatHappened: 'Your website and portal foundation were assembled.',
      whyItMatters: 'There’s something real to review — not just a plan.',
      whatItUnlocked: 'Review — your feedback shapes the finish.',
    },
    Review: {
      whatHappened: 'You reviewed the work and shared what to refine.',
      whyItMatters: 'Launch reflects your standards, not assumptions.',
      whatItUnlocked: 'Launch — going live with confidence.',
    },
    Launch: {
      whatHappened: 'Your presence is live for customers to meet.',
      whyItMatters: 'The work is in the world — not stuck in drafts.',
      whatItUnlocked: 'Care — ongoing support after go-live.',
    },
    Care: {
      whatHappened: 'You’re in ongoing care with your team.',
      whyItMatters: 'Launch is a beginning, not a goodbye.',
      whatItUnlocked: 'Continued help whenever you need it.',
    },
  };

  const d = details[stage];
  return {
    stage,
    title: milestoneTitle(stage),
    whatHappened: d.whatHappened,
    whyItMatters: d.whyItMatters,
    whatItUnlocked: d.whatItUnlocked,
    whatHappensNext: narrative.transitionToNext.includes(nextName)
      ? narrative.transitionToNext
      : `Next we focus on ${nextName}.`,
  };
}

function confidenceForStage(
  stage: GuideLifecycleStage,
  view: CtpPortalStatusView,
  nba: GuideNextBestAction,
): string {
  if (nba.nothingRequired) {
    if (stage === 'Build') {
      return 'Everything is moving. Nothing is needed from you today — we’re preparing the next reviewable step.';
    }
    if (stage === 'Discovery' || stage === 'Strategy') {
      return 'We’re already preparing the next phase. We’ll ask only when something truly needs you.';
    }
    return 'Nothing is needed from you today. Our team is advancing the project.';
  }

  if (view.reviewScheduledAt && (stage === 'Strategy' || stage === 'Discovery')) {
    return 'Your conversation is scheduled — we’re preparing so that time is well used.';
  }

  if (nba.kind === 'approval' || nba.kind === 'payment') {
    return 'We’re waiting on your confirmation before moving into the next chapter.';
  }

  if (nba.kind === 'upload' || nba.kind === 'information') {
    return 'We’re ready on our side — a few details from you unlock the next step.';
  }

  if (nba.kind === 'review') {
    return 'Your review is the key that keeps quality high before launch.';
  }

  if (nba.kind === 'celebrate') {
    return 'This is a real milestone — take a moment, then we’ll show what’s next.';
  }

  if (nba.kind === 'meeting') {
    return 'A short conversation will keep everyone aligned before we go further.';
  }

  return 'You’re in good hands — one clear step at a time.';
}

/**
 * NBA priority:
 * 1 blocking · 2 meeting · 3 approval · 4 upload · 5 payment ·
 * 6 information · 7 review · 8 celebrate · 9 wait
 */
function resolveNba(
  slug: string,
  stage: GuideLifecycleStage,
  view: CtpPortalStatusView,
): GuideNextBestAction {
  const journey = opportunityDashboardPath(slug);
  const progress = designStudioPath(slug);
  const reviewHref = opportunityReviewPath(slug);
  const support = portalCtpPath(slug, 'ctp/support');
  const candidates: NbaCandidate[] = [];

  const needsDesign = designStillNeeded(view);
  const studioReady = view.studioStatus === 'Ready For Review';
  const hasProposal = Boolean(view.proposalId);
  const meetingScheduled = Boolean(view.reviewScheduledAt);
  const siteLive = Boolean(view.siteUrl);
  const completed = view.status === 'Completed';

  // 1 — Blocking client action (hard stops)
  if (stage === 'Design' && needsDesign) {
    candidates.push({
      priority: 1,
      kind: 'blocking',
      nothingRequired: false,
      label: 'Complete your Design details',
      href: `${progress}#design-studio`,
      why: 'Without these brand basics, we can’t prepare concepts that feel like you.',
      duration: '10–20 minutes',
      after: 'We’ll begin preparing your first directions.',
    });
  }

  // 2 — Scheduled meeting (if not yet booked and Strategy needs it)
  if (
    !meetingScheduled &&
    (stage === 'Strategy' ||
      (stage === 'Discovery' && (hasProposal || Boolean(view.snapshotSummary))))
  ) {
    candidates.push({
      priority: 2,
      kind: 'meeting',
      nothingRequired: false,
      label: 'Schedule your strategy conversation',
      href: reviewHref,
      why: 'A short conversation aligns priorities before the plan is finalized.',
      duration: 'Pick a time that works',
      after: 'We’ll prepare your proposal with that context.',
    });
  }

  // 3 — Required approval (Agreement / Proposal confirmation)
  if ((stage === 'Agreement' || stage === 'Proposal') && hasProposal) {
    candidates.push({
      priority: stage === 'Agreement' ? 3 : 3,
      kind: 'approval',
      nothingRequired: false,
      label: stage === 'Agreement' ? 'Confirm to continue' : 'Review your proposal',
      href: `/proposal/${encodeURIComponent(view.proposalId!)}`,
      why:
        stage === 'Agreement'
          ? 'Confirmation lets us begin Design without delay.'
          : 'Understand the plan and investment before we continue.',
      duration: '10–15 minutes',
      after:
        stage === 'Agreement'
          ? 'We’ll ask for brand details and start concepts.'
          : 'Confirm when you’re ready so we can begin Design.',
    });
  }

  // 4 — Required upload (subset of design needs — logo/photos still needed)
  const uploadNeeded = view.designStudio.some(
    (item) =>
      item.status === 'needed' &&
      (item.id === 'logo' || item.id === 'photography' || item.id === 'documents'),
  );
  if (uploadNeeded && (stage === 'Design' || stage === 'Agreement')) {
    candidates.push({
      priority: 4,
      kind: 'upload',
      nothingRequired: false,
      label: 'Upload brand materials',
      href: `${progress}#design-studio`,
      why: 'Files you already have — logo and photos — speed up accurate concepts.',
      duration: '5–10 minutes',
      after: 'We’ll use them as the visual foundation for your directions.',
    });
  }

  // 5 — Required payment (same surface as approval when proposal exists at Agreement)
  if (stage === 'Agreement' && hasProposal) {
    candidates.push({
      priority: 5,
      kind: 'payment',
      nothingRequired: false,
      label: 'Complete confirmation',
      href: `/proposal/${encodeURIComponent(view.proposalId!)}`,
      why: 'This unlocks Design and keeps the project moving.',
      duration: 'A few minutes',
      after: 'We’ll begin Design immediately on our side.',
    });
  }

  // 6 — Information request (non-upload design fields / journey orientation)
  if (stage === 'Welcome' || (stage === 'Discovery' && !hasProposal && !view.snapshotSummary)) {
    candidates.push({
      priority: 6,
      kind: 'information',
      nothingRequired: false,
      label: 'Continue Your Journey',
      href: journey,
      why: 'See what we’ve already noticed — it sets up everything that follows.',
      duration: '5–10 minutes',
      after: 'Return here for the one next step that moves the project forward.',
    });
  }

  if (stage === 'Design' && needsDesign && !uploadNeeded) {
    candidates.push({
      priority: 6,
      kind: 'information',
      nothingRequired: false,
      label: 'Share brand preferences',
      href: `${progress}#design-studio`,
      why: 'Voice, colors, and inspiration keep concepts aligned with you.',
      duration: '10–15 minutes',
      after: 'We’ll prepare directions for you to review.',
    });
  }

  // 7 — Review deliverable
  if (studioReady || stage === 'Review') {
    candidates.push({
      priority: 7,
      kind: 'review',
      nothingRequired: false,
      label: 'Review your directions',
      href: `${progress}#design-studio`,
      why: 'Your feedback keeps the finish aligned with your vision.',
      duration: '15–30 minutes',
      after: 'We’ll refine and move toward launch.',
    });
  }

  if (siteLive && (stage === 'Launch' || stage === 'Care')) {
    candidates.push({
      priority: stage === 'Launch' ? 8 : 7,
      kind: stage === 'Launch' ? 'celebrate' : 'review',
      nothingRequired: false,
      label: 'Open your live website',
      href: view.siteUrl!,
      why: 'See what your customers will experience.',
      duration: 'About 1 minute',
      after: 'Come back anytime for support and next steps.',
      external: true,
    });
  }

  // 8 — Celebrate (launch complete)
  if (completed && siteLive && stage === 'Care') {
    candidates.push({
      priority: 8,
      kind: 'celebrate',
      nothingRequired: false,
      label: 'Celebrate — view your live site',
      href: view.siteUrl!,
      why: 'You made it. This is the presence you built together.',
      duration: 'A moment',
      after: 'Use Support anytime — Care continues.',
      external: true,
    });
  }

  // 9 — Nothing required (wait)
  if (
    stage === 'Build' ||
    (stage === 'Discovery' && !candidates.some((c) => c.priority < 9)) ||
    (stage === 'Strategy' && meetingScheduled)
  ) {
    candidates.push({
      priority: 9,
      kind: 'wait',
      nothingRequired: true,
      label: 'Nothing is needed from you today',
      href: support,
      why:
        stage === 'Build'
          ? 'Our team is preparing your first reviewable build.'
          : meetingScheduled
            ? 'We’re preparing for your scheduled conversation.'
            : 'We’re advancing Discovery and will ask only when something needs you.',
      duration: 'No action required',
      after: 'We’ll update this Guide when it’s your turn again.',
    });
  }

  // Always have a wait fallback
  candidates.push({
    priority: 9,
    kind: 'wait',
    nothingRequired: true,
    label: 'Nothing is needed from you today',
    href: support,
    why: 'Our team is preparing the next chapter of your project.',
    duration: 'No action required',
    after: 'Your next action will appear here when it’s your turn.',
  });

  candidates.sort((a, b) => a.priority - b.priority);
  const winner = candidates[0]!;
  const { priority: _p, ...nba } = winner;
  return nba;
}

export function buildGuideProgressView(
  slug: string,
  view: CtpPortalStatusView,
): GuideProgressView {
  const { current: currentStage, done } = resolveGuideStages(view);
  const narrative = GUIDE_STAGE_NARRATIVES[currentStage];
  const currentIndex = GUIDE_LIFECYCLE_STAGES.indexOf(currentStage);
  const whatsNextStage =
    currentIndex >= 0 && currentIndex < GUIDE_LIFECYCLE_STAGES.length - 1
      ? GUIDE_LIFECYCLE_STAGES[currentIndex + 1]!
      : null;

  const completedBefore = GUIDE_LIFECYCLE_STAGES.slice(0, Math.max(0, currentIndex))
    .filter((stage) => done[stage])
    .map((stage, index, arr) => {
      const next =
        index < arr.length - 1
          ? arr[index + 1]!
          : currentStage;
      return buildMilestone(stage, next);
    });

  const nba = resolveNba(slug, currentStage, view);
  const confidenceMessage = confidenceForStage(currentStage, view, nba);
  const celebrationMessage = celebrationForStage(currentStage, nba);
  const documentsAvailable = resolveGuideDocumentsAvailable(done, view);

  const showDesignStudio =
    currentStage === 'Design' ||
    currentStage === 'Review' ||
    ((currentStage === 'Agreement' || currentStage === 'Proposal') &&
      designStillNeeded(view) &&
      !nba.nothingRequired);

  return {
    businessName: view.businessName,
    currentStage,
    headline: narrative.headline,
    summary: narrative.summary,
    stageWhy: narrative.summary,
    estimatedCompletion: narrative.expectedDuration,
    confidenceMessage,
    celebrationMessage,
    behindTheScenes: narrative.behindTheScenes,
    commonQuestions: narrative.commonQuestions,
    whatsNextStage,
    whatsNextCopy: narrative.transitionToNext,
    completed: completedBefore,
    timeline: completedBefore,
    documentsAvailable,
    nba,
    showDesignStudio,
  };
}
