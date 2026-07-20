/**
 * Guide Stage Transition Engine — canonical lifecycle rules.
 * Pure predicates over CtpPortalStatusView. No second status system.
 */
import type { CtpPortalStatusView, CtpTimelineStep } from '@/lib/ctp-portal-status';

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

export type GuideStageDefinition = {
  stage: GuideLifecycleStage;
  next: GuideLifecycleStage | null;
  /** Human-readable entry conditions (docs + tests). */
  entryConditions: string[];
  /** Human-readable exit / completion conditions. */
  exitConditions: string[];
  /** Events that typically complete this stage. */
  completionEvents: string[];
  /** Client-facing documents unlocked when this stage completes. */
  documentsUnlocked: string[];
  /** Major celebration when this stage completes (optional). */
  celebration?: { title: string; message: string };
  /** Client notification when this stage completes (optional). */
  notification?: { title: string; detail: string };
};

export type GuideStageResolution = {
  current: GuideLifecycleStage;
  done: Record<GuideLifecycleStage, boolean>;
  completed: GuideLifecycleStage[];
};

export type GuideStageTransition = {
  from: GuideLifecycleStage;
  to: GuideLifecycleStage;
  newlyCompleted: GuideLifecycleStage[];
};

function step(timeline: CtpTimelineStep[], id: string): CtpTimelineStep | undefined {
  return timeline.find((item) => item.id === id);
}

function isComplete(timeline: CtpTimelineStep[], id: string): boolean {
  return step(timeline, id)?.state === 'complete';
}

/** Explicit catalog for every Welcome → Care edge. */
export const GUIDE_STAGE_DEFINITIONS: Record<GuideLifecycleStage, GuideStageDefinition> = {
  Welcome: {
    stage: 'Welcome',
    next: 'Discovery',
    entryConditions: ['Client portal session exists for this project'],
    exitConditions: ['Project home is open (always true once portal-bound)'],
    completionEvents: ['portal.provisioned', 'ctp.workspace.active'],
    documentsUnlocked: ['Your Project home'],
    celebration: {
      title: 'Welcome Complete',
      message: 'Your project home is open. We’re ready to learn your business.',
    },
    notification: {
      title: 'Your project home is ready',
      detail: 'Open Progress anytime to see where things stand and what comes next.',
    },
  },
  Discovery: {
    stage: 'Discovery',
    next: 'Strategy',
    entryConditions: ['Welcome complete'],
    exitConditions: [
      'Assessment captured',
      'Intake / evaluation available',
      'Digital presence review complete or not required',
    ],
    completionEvents: ['ctp.submitted', 'ctp.intake.analyzed', 'ctp.digital.audit'],
    documentsUnlocked: ['Discovery summary'],
    celebration: {
      title: 'Discovery Complete',
      message: 'We understand enough about your business to recommend a clear path.',
    },
    notification: {
      title: 'Discovery is complete',
      detail: 'We’re turning what we learned into priorities for your strategy.',
    },
  },
  Strategy: {
    stage: 'Strategy',
    next: 'Proposal',
    entryConditions: ['Discovery complete'],
    exitConditions: [
      'Strategy snapshot available',
      'Or strategy conversation scheduled',
      'Or executive priorities prepared',
    ],
    completionEvents: ['ctp.bi.ready', 'ctp.review.scheduled'],
    documentsUnlocked: ['Strategy priorities'],
    celebration: {
      title: 'Strategy Complete',
      message: 'Your priorities are clear — the plan can take shape.',
    },
    notification: {
      title: 'Your strategy is taking shape',
      detail: 'We’re preparing the plan and investment for your review.',
    },
  },
  Proposal: {
    stage: 'Proposal',
    next: 'Agreement',
    entryConditions: ['Strategy complete'],
    exitConditions: ['Proposal identifier is available for review'],
    completionEvents: ['proposal.pending', 'proposal.completed'],
    documentsUnlocked: ['Your proposal'],
    celebration: {
      title: 'Proposal Ready',
      message: 'Your plan and investment are ready to review when you are.',
    },
    notification: {
      title: 'Your proposal is ready',
      detail: 'Review the plan calmly — confirmation comes when you’re ready.',
    },
  },
  Agreement: {
    stage: 'Agreement',
    next: 'Design',
    entryConditions: ['Proposal delivered'],
    exitConditions: [
      'Design underway or complete',
      'Or studio active',
      'Or site already in progress / live',
    ],
    completionEvents: ['proposal.approved', 'ctp.studio.started'],
    documentsUnlocked: ['Agreement confirmation'],
    celebration: {
      title: 'Proposal Approved',
      message: 'You’re confirmed. We can begin Design with confidence.',
    },
    notification: {
      title: 'Your approval has been received',
      detail: 'We’ve started designing your website. We’ll ask only for what unlocks first concepts.',
    },
  },
  Design: {
    stage: 'Design',
    next: 'Build',
    entryConditions: ['Agreement complete'],
    exitConditions: ['Client design input marked complete on the project timeline'],
    completionEvents: ['ctp.studio.input', 'ctp.studio.complete'],
    documentsUnlocked: ['Brand direction notes'],
    celebration: {
      title: 'Design Complete',
      message: 'Brand direction is clear enough for us to craft your presence.',
    },
    notification: {
      title: 'Your project has moved into development',
      detail: 'Your brand details are in — we’re assembling your website and portal.',
    },
  },
  Build: {
    stage: 'Build',
    next: 'Review',
    entryConditions: ['Design complete'],
    exitConditions: ['Build step complete on timeline, or live site URL available'],
    completionEvents: ['ctp.production.ready', 'ctp.website.live', 'ctp.studio.ready'],
    documentsUnlocked: ['Preview when ready'],
    celebration: {
      title: 'Website Ready for Review',
      message: 'A reviewable version of your presence is ready for your eye.',
    },
    notification: {
      title: 'Your website is ready for review',
      detail: 'Please look closely and share clear feedback so we can refine with confidence.',
    },
  },
  Review: {
    stage: 'Review',
    next: 'Launch',
    entryConditions: ['Build complete'],
    exitConditions: ['Executive review complete, or project marked Completed'],
    completionEvents: ['ctp.ready_for_review', 'ctp.revealed'],
    documentsUnlocked: ['Review checklist'],
    celebration: {
      title: 'Review Complete',
      message: 'Your feedback is in — refinements and launch checks come next.',
    },
    notification: {
      title: 'Thanks — your review is in',
      detail: 'We’re refining with your notes and preparing for launch.',
    },
  },
  Launch: {
    stage: 'Launch',
    next: 'Care',
    entryConditions: ['Review complete'],
    exitConditions: ['Reveal complete, or Completed with a live site URL'],
    completionEvents: ['ctp.revealed', 'ctp.website.live'],
    documentsUnlocked: ['Live website'],
    celebration: {
      title: 'Project Launched',
      message: 'Your presence is live. Take a moment — then we’ll stay with you in Care.',
    },
    notification: {
      title: 'Your project is live',
      detail: 'Open your website, share it, and tell us if anything needs a quick fix.',
    },
  },
  Care: {
    stage: 'Care',
    next: null,
    entryConditions: ['Launch complete with a live site'],
    exitConditions: ['Ongoing — Care remains available'],
    completionEvents: ['ctp.revealed'],
    documentsUnlocked: ['Support & Messages'],
    celebration: {
      title: 'Care Underway',
      message: 'Launch is a beginning. We’re still with you for questions and next steps.',
    },
    notification: {
      title: 'You’re in ongoing care',
      detail: 'Use Support or Messages anytime — a real person on your team will respond.',
    },
  },
};

export function resolveGuideStageDone(
  view: CtpPortalStatusView,
): Record<GuideLifecycleStage, boolean> {
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

export function resolveGuideCurrentStage(
  done: Record<GuideLifecycleStage, boolean>,
  view: CtpPortalStatusView,
): GuideLifecycleStage {
  if (view.status === 'Completed' && view.siteUrl) return 'Care';

  for (const stage of GUIDE_LIFECYCLE_STAGES) {
    if (!done[stage]) return stage;
  }
  return 'Care';
}

export function resolveGuideStages(view: CtpPortalStatusView): GuideStageResolution {
  const done = resolveGuideStageDone(view);
  const current = resolveGuideCurrentStage(done, view);
  const completed = GUIDE_LIFECYCLE_STAGES.filter((stage) => done[stage]);
  return { current, done, completed };
}

/** Diff two resolutions — returns null when current stage is unchanged. */
export function detectGuideTransition(
  prev: GuideStageResolution,
  next: GuideStageResolution,
): GuideStageTransition | null {
  const newlyCompleted = GUIDE_LIFECYCLE_STAGES.filter(
    (stage) => next.done[stage] && !prev.done[stage],
  );

  if (prev.current === next.current && newlyCompleted.length === 0) {
    return null;
  }

  return {
    from: prev.current,
    to: next.current,
    newlyCompleted,
  };
}

/** Documents available to the client given completed stages. */
export function resolveGuideDocumentsAvailable(
  done: Record<GuideLifecycleStage, boolean>,
  view: CtpPortalStatusView,
): { label: string; href?: string }[] {
  const docs: { label: string; href?: string }[] = [{ label: 'Your Project home' }];

  if (done.Discovery) docs.push({ label: 'Discovery summary' });
  if (done.Strategy) docs.push({ label: 'Strategy priorities' });
  if (done.Proposal && view.proposalId) {
    docs.push({
      label: 'Your proposal',
      href: `/proposal/${encodeURIComponent(view.proposalId)}`,
    });
  }
  if (done.Agreement) docs.push({ label: 'Agreement confirmation' });
  if (done.Design) docs.push({ label: 'Brand direction notes' });
  if (done.Build || view.studioStatus === 'Ready For Review') {
    docs.push({ label: 'Preview when ready' });
  }
  if (done.Review) docs.push({ label: 'Review checklist' });
  if (view.siteUrl) {
    docs.push({ label: 'Live website', href: view.siteUrl });
  }
  if (done.Care || done.Launch) docs.push({ label: 'Support & Messages' });

  const seen = new Set<string>();
  return docs.filter((doc) => {
    if (seen.has(doc.label)) return false;
    seen.add(doc.label);
    return true;
  });
}
