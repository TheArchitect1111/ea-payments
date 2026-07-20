/**
 * Guide Progress view — presentation adapter only.
 * Maps CTP portal status → Guide Operating System lifecycle.
 * Does not change submissions, provisioning, or auth.
 */
import type { CtpPortalStatusView, CtpTimelineStep } from '@/lib/ctp-portal-status';
import {
  designStudioPath,
  opportunityDashboardPath,
  opportunityReviewPath,
  portalCtpPath,
} from '@/lib/ctp-opportunity-routes';

export const GUIDE_LIFECYCLE_STAGES = [
  'Welcome',
  'Discovery',
  'Strategy',
  'Proposal',
  'Agreement',
  'Design',
  'Build',
  'Review',
  'Launch',
  'Care',
] as const;

export type GuideLifecycleStage = (typeof GUIDE_LIFECYCLE_STAGES)[number];

export type GuideMilestone = {
  stage: GuideLifecycleStage;
  title: string;
  explanation: string;
};

export type GuideNextBestAction = {
  label: string;
  href: string;
  why: string;
  duration: string;
  after: string;
  external?: boolean;
};

export type GuideProgressView = {
  businessName: string;
  currentStage: GuideLifecycleStage;
  stageWhy: string;
  estimatedCompletion?: string;
  behindTheScenes: string;
  whatsNextStage: GuideLifecycleStage | null;
  whatsNextCopy: string;
  completed: GuideMilestone[];
  nba: GuideNextBestAction;
  showDesignStudio: boolean;
};

const STAGE_WHY: Record<GuideLifecycleStage, string> = {
  Welcome: 'You’ve arrived — we’re orienting your project and making sure you’re set up for success.',
  Discovery:
    'We’re learning how your business works so every recommendation fits the way you actually operate.',
  Strategy: 'We’re turning what we learned into a clear path forward — priorities, not noise.',
  Proposal: 'Your plan and investment are ready so you can decide with full clarity.',
  Agreement: 'Confirmation lets us build with confidence and keep momentum.',
  Design: 'Your brand choices shape the first directions we create for you.',
  Build: 'Our team is crafting your website and portal experience.',
  Review: 'Your turn to look closely and tell us what to refine.',
  Launch: 'You’re going live — the moment your presence meets the world.',
  Care: 'We’re still with you after launch — questions, tweaks, and next steps.',
};

const BEHIND: Record<GuideLifecycleStage, string> = {
  Welcome: 'Our team is preparing your project home and gathering what we already know about your business.',
  Discovery: 'We’re reviewing what you shared and studying how you show up online.',
  Strategy: 'We’re shaping recommendations and getting ready to walk you through them.',
  Proposal: 'We’re finalizing the plan details so you can review them in one place.',
  Agreement: 'We’re standing by to begin Design as soon as you’re ready to confirm.',
  Design: 'We’re waiting on a few brand details from you, then we’ll prepare first concepts.',
  Build: 'Our design and development team is assembling your website and portal.',
  Review: 'We’re preparing your preview and collecting anything needed for your feedback.',
  Launch: 'We’re finishing launch checks so your site is ready to share.',
  Care: 'We’re monitoring your live presence and staying available for support.',
};

function step(timeline: CtpTimelineStep[], id: string): CtpTimelineStep | undefined {
  return timeline.find((item) => item.id === id);
}

function isComplete(timeline: CtpTimelineStep[], id: string): boolean {
  return step(timeline, id)?.state === 'complete';
}

function resolveStageStates(view: CtpPortalStatusView): Record<GuideLifecycleStage, boolean> {
  const t = view.timeline;
  const digital = step(t, 'digital-audit');
  const digitalDone =
    isComplete(t, 'digital-audit') ||
    Boolean(digital?.detail.toLowerCase().includes('not required'));
  const discoveryDone =
    isComplete(t, 'assessment') &&
    (isComplete(t, 'ai-evaluation') || Boolean(view.intakeSummary)) &&
    digitalDone;

  const strategyDone =
    isComplete(t, 'executive-report') ||
    Boolean(view.reviewScheduledAt) ||
    Boolean(view.snapshotSummary);
  const proposalDone = Boolean(view.proposalId);
  const designDone = isComplete(t, 'client-input');
  const agreementDone =
    designDone ||
    view.studioStatus === 'In Progress' ||
    view.studioStatus === 'Ready For Review' ||
    view.studioStatus === 'Completed' ||
    isComplete(t, 'ai-building') ||
    Boolean(view.siteUrl);
  const buildDone = isComplete(t, 'ai-building') || Boolean(view.siteUrl);
  const reviewDone = isComplete(t, 'executive-review') || view.status === 'Completed';
  const launchDone =
    isComplete(t, 'reveal') || (view.status === 'Completed' && Boolean(view.siteUrl));
  const careDone = view.status === 'Completed' && Boolean(view.siteUrl);

  return {
    Welcome: true,
    Discovery: Boolean(discoveryDone || strategyDone || proposalDone),
    Strategy: Boolean(strategyDone || proposalDone),
    Proposal: proposalDone,
    Agreement: Boolean(agreementDone),
    Design: designDone,
    Build: buildDone,
    Review: reviewDone,
    Launch: launchDone,
    Care: careDone,
  };
}

function resolveCurrentStage(
  done: Record<GuideLifecycleStage, boolean>,
  view: CtpPortalStatusView,
): GuideLifecycleStage {
  if (view.status === 'Completed' && view.siteUrl) return 'Care';

  for (const stage of GUIDE_LIFECYCLE_STAGES) {
    if (!done[stage]) return stage;
  }
  return 'Care';
}

function milestoneTitle(stage: GuideLifecycleStage): string {
  switch (stage) {
    case 'Welcome':
      return 'Welcome Complete';
    case 'Discovery':
      return 'Discovery Complete';
    case 'Strategy':
      return 'Strategy Complete';
    case 'Proposal':
      return 'Proposal Delivered';
    case 'Agreement':
      return 'Agreement Signed';
    case 'Design':
      return 'Design Complete';
    case 'Build':
      return 'Build Complete';
    case 'Review':
      return 'Review Complete';
    case 'Launch':
      return 'Launch Complete';
    case 'Care':
      return 'Care Underway';
    default:
      return stage;
  }
}

function milestoneExplanation(stage: GuideLifecycleStage): string {
  switch (stage) {
    case 'Welcome':
      return 'Your project home is open and your team is connected.';
    case 'Discovery':
      return 'We captured what matters about your business and how you show up today.';
    case 'Strategy':
      return 'We defined the priorities that will create the most capacity for you.';
    case 'Proposal':
      return 'Your plan and investment details were delivered for review.';
    case 'Agreement':
      return 'You’re confirmed — we can build with clarity.';
    case 'Design':
      return 'Brand direction and materials are in place for your first concepts.';
    case 'Build':
      return 'Your website and portal foundation were assembled.';
    case 'Review':
      return 'You reviewed the work and shared what to refine.';
    case 'Launch':
      return 'Your presence is live for the world to meet.';
    case 'Care':
      return 'Ongoing support is available whenever you need us.';
    default:
      return '';
  }
}

function designStillNeeded(view: CtpPortalStatusView): boolean {
  return view.designStudio.some((item) => item.status === 'needed');
}

function buildNba(
  slug: string,
  stage: GuideLifecycleStage,
  view: CtpPortalStatusView,
): GuideNextBestAction {
  const journey = opportunityDashboardPath(slug);
  const progress = designStudioPath(slug);
  const review = opportunityReviewPath(slug);
  const support = portalCtpPath(slug, 'ctp/support');
  const documents = portalCtpPath(slug, 'ctp/documents');

  if (view.siteUrl && (stage === 'Launch' || stage === 'Care')) {
    return {
      label: 'Open your live website',
      href: view.siteUrl,
      why: 'See what your customers will experience.',
      duration: 'About 1 minute',
      after: 'Come back here anytime for support and next steps.',
      external: true,
    };
  }

  if (stage === 'Design' || (stage === 'Agreement' && designStillNeeded(view))) {
    return {
      label: 'Continue Design',
      href: `${progress}#design-studio`,
      why: 'A few brand details unlock your first concepts.',
      duration: '10–20 minutes',
      after: 'We’ll prepare directions for you to review.',
    };
  }

  if (stage === 'Review' || view.studioStatus === 'Ready For Review') {
    return {
      label: 'Review your directions',
      href: `${progress}#design-studio`,
      why: 'Your feedback keeps the build aligned with your vision.',
      duration: '15–30 minutes',
      after: 'We’ll refine and move toward launch.',
    };
  }

  if (stage === 'Proposal' && view.proposalId) {
    return {
      label: 'Review your proposal',
      href: `/proposal/${encodeURIComponent(view.proposalId)}`,
      why: 'Understand the plan and investment before we continue.',
      duration: '10–15 minutes',
      after: 'Confirm when you’re ready so we can begin Design.',
    };
  }

  if (stage === 'Strategy' || (stage === 'Discovery' && !view.reviewScheduledAt && Boolean(view.proposalId || view.snapshotSummary))) {
    return {
      label: 'Schedule your strategy conversation',
      href: review,
      why: 'A short conversation aligns priorities before the plan is finalized.',
      duration: 'Pick a time that works',
      after: 'We’ll prepare your proposal with that context.',
    };
  }

  if (stage === 'Welcome' || stage === 'Discovery') {
    return {
      label: 'Continue Your Journey',
      href: journey,
      why: 'See what we’ve already noticed about your business.',
      duration: '5–10 minutes',
      after: 'You’ll return here for the one next step that moves the project forward.',
    };
  }

  if (stage === 'Build') {
    return {
      label: 'Message your team',
      href: support,
      why: 'Nothing is required from you right now — reach out if a question comes up.',
      duration: 'Optional',
      after: 'We’ll notify you when it’s time to review.',
    };
  }

  if (stage === 'Agreement') {
    return {
      label: 'Review your proposal',
      href: view.proposalId
        ? `/proposal/${encodeURIComponent(view.proposalId)}`
        : documents,
      why: 'Confirmation lets us begin Design without delay.',
      duration: '10–15 minutes',
      after: 'We’ll ask for brand details and start concepts.',
    };
  }

  return {
    label: 'See your project home',
    href: journey,
    why: 'Stay oriented while we prepare the next chapter.',
    duration: 'A few minutes',
    after: 'Your next action will appear here when it’s your turn.',
  };
}

export function buildGuideProgressView(
  slug: string,
  view: CtpPortalStatusView,
): GuideProgressView {
  const done = resolveStageStates(view);
  const currentStage = resolveCurrentStage(done, view);
  const currentIndex = GUIDE_LIFECYCLE_STAGES.indexOf(currentStage);
  const whatsNextStage =
    currentIndex >= 0 && currentIndex < GUIDE_LIFECYCLE_STAGES.length - 1
      ? GUIDE_LIFECYCLE_STAGES[currentIndex + 1]!
      : null;

  const completed: GuideMilestone[] = GUIDE_LIFECYCLE_STAGES.filter(
    (stage) => done[stage] && stage !== currentStage,
  ).map((stage) => ({
    stage,
    title: milestoneTitle(stage),
    explanation: milestoneExplanation(stage),
  }));

  // If Welcome is current, completed may be empty — fine.
  // Prefer showing completed stages before current only.
  const completedBefore = GUIDE_LIFECYCLE_STAGES.slice(0, Math.max(0, currentIndex))
    .filter((stage) => done[stage])
    .map((stage) => ({
      stage,
      title: milestoneTitle(stage),
      explanation: milestoneExplanation(stage),
    }));

  const estimatedCompletion =
    currentStage === 'Build' || currentStage === 'Design'
      ? 'Typically 1–3 weeks for this chapter, depending on feedback timing.'
      : currentStage === 'Care'
        ? undefined
        : currentStage === 'Launch'
          ? 'Launch checks usually finish within a few days once Review is done.'
          : undefined;

  const showDesignStudio =
    currentStage === 'Design' ||
    currentStage === 'Review' ||
    (currentStage === 'Agreement' && designStillNeeded(view));

  return {
    businessName: view.businessName,
    currentStage,
    stageWhy: STAGE_WHY[currentStage],
    estimatedCompletion,
    behindTheScenes: BEHIND[currentStage],
    whatsNextStage,
    whatsNextCopy: whatsNextStage
      ? `After ${currentStage}, we move into ${whatsNextStage}: ${STAGE_WHY[whatsNextStage]}`
      : 'You’re in Care — reach out anytime; we’ll keep supporting you.',
    completed: completedBefore.length ? completedBefore : completed,
    nba: buildNba(slug, currentStage, view),
    showDesignStudio,
  };
}
