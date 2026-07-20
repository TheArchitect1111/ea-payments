/**
 * Project State Engine — Single Source of Truth for client project stage.
 *
 * Evidence sources (payments, Calendly, uploads, siteUrl, WPS, CTP metadata)
 * may contribute evidence but MUST NEVER directly set the stage.
 * Only this engine advances Welcome → Care.
 */
import {
  GUIDE_LIFECYCLE_STAGES,
  GUIDE_STAGE_DEFINITIONS,
  type GuideLifecycleStage,
  type GuideStageResolution,
} from '@/lib/ctp-guide-stage-engine';
import type { CtpSubmission } from '@/lib/ctp-submissions';

export { GUIDE_LIFECYCLE_STAGES, type GuideLifecycleStage };

/** Accumulated evidence — flags only. Never treated as stage. */
export type ProjectEvidenceKind =
  | 'portal.bound'
  | 'discovery.complete'
  | 'strategy.ready'
  | 'proposal.ready'
  | 'payment.completed'
  | 'design.started'
  | 'design.complete'
  | 'build.ready_for_review'
  | 'review.approved'
  | 'project.launched';

export type ProjectEvidenceState = {
  flags: Partial<Record<ProjectEvidenceKind, true>>;
  at: Partial<Record<ProjectEvidenceKind, string>>;
};

export type ProjectTransitionRule = {
  from: GuideLifecycleStage;
  to: GuideLifecycleStage;
  /** All required evidence flags must be present. */
  required: ProjectEvidenceKind[];
  optional?: ProjectEvidenceKind[];
  /** If present, block this transition. */
  blocking?: ProjectEvidenceKind[];
  celebration?: { title: string; message: string };
};

export type ProjectStateSnapshot = {
  stage: GuideLifecycleStage;
  evidence: ProjectEvidenceState;
  resolution: GuideStageResolution;
};

export type ProjectStateApplyResult = {
  changed: boolean;
  previous: GuideLifecycleStage;
  stage: GuideLifecycleStage;
  evidence: ProjectEvidenceState;
  newlyCompleted: GuideLifecycleStage[];
  celebration?: { title: string; message: string };
  patch: {
    guideStage: GuideLifecycleStage;
    projectEvidence: ProjectEvidenceState;
    agreementPaidAt?: string;
  };
};

/** Synthetic Website+Portal IDs are infrastructure — never proposal/agreement truth. */
export function isAuthoritativeProposalId(proposalId: string | undefined | null): boolean {
  const id = (proposalId ?? '').trim();
  if (!id) return false;
  if (/^WPS-/i.test(id)) return false;
  if (/^WPS-ASSESS-/i.test(id)) return false;
  return true;
}

export function emptyProjectEvidence(): ProjectEvidenceState {
  return { flags: {}, at: {} };
}

export function normalizeEvidence(raw: ProjectEvidenceState | undefined): ProjectEvidenceState {
  if (!raw) return emptyProjectEvidence();
  return {
    flags: { ...(raw.flags ?? {}) },
    at: { ...(raw.at ?? {}) },
  };
}

/** Ordered transitions — evaluated from current stage forward only (no skip without evidence). */
export const PROJECT_TRANSITION_RULES: ProjectTransitionRule[] = [
  {
    from: 'Welcome',
    to: 'Discovery',
    required: ['portal.bound'],
    celebration: GUIDE_STAGE_DEFINITIONS.Welcome.celebration,
  },
  {
    from: 'Discovery',
    to: 'Strategy',
    required: ['discovery.complete'],
    celebration: GUIDE_STAGE_DEFINITIONS.Discovery.celebration,
  },
  {
    from: 'Strategy',
    to: 'Proposal',
    /** Authoritative proposal only — never WPS synthetic IDs (filtered at emit). */
    required: ['proposal.ready'],
    optional: ['strategy.ready'],
    celebration: GUIDE_STAGE_DEFINITIONS.Strategy.celebration,
  },
  {
    from: 'Proposal',
    to: 'Agreement',
    /** Client has a real proposal and is in the confirmation window. */
    required: ['proposal.ready'],
    celebration: GUIDE_STAGE_DEFINITIONS.Proposal.celebration,
  },
  {
    from: 'Agreement',
    to: 'Design',
    /** Payment is the ONLY path out of Agreement. */
    required: ['payment.completed'],
    celebration: GUIDE_STAGE_DEFINITIONS.Agreement.celebration,
  },
  {
    from: 'Proposal',
    to: 'Design',
    /** Payment may clear Proposal+Agreement in one reconciliation. */
    required: ['payment.completed', 'proposal.ready'],
    celebration: GUIDE_STAGE_DEFINITIONS.Agreement.celebration,
  },
  {
    from: 'Design',
    to: 'Build',
    required: ['design.complete'],
    optional: ['design.started'],
    celebration: GUIDE_STAGE_DEFINITIONS.Design.celebration,
  },
  {
    from: 'Build',
    to: 'Review',
    required: ['build.ready_for_review'],
    celebration: GUIDE_STAGE_DEFINITIONS.Build.celebration,
  },
  {
    from: 'Review',
    to: 'Launch',
    required: ['review.approved'],
    celebration: GUIDE_STAGE_DEFINITIONS.Review.celebration,
  },
  {
    from: 'Launch',
    to: 'Care',
    required: ['project.launched'],
    celebration: GUIDE_STAGE_DEFINITIONS.Launch.celebration,
  },
];

/**
 * Stages completed = every stage strictly before the canonical current.
 * Care is ongoing — Launch is complete when current is Care.
 */
export function resolutionFromCanonicalStage(
  current: GuideLifecycleStage,
): GuideStageResolution {
  const currentIndex = GUIDE_LIFECYCLE_STAGES.indexOf(current);
  const done = {} as Record<GuideLifecycleStage, boolean>;
  for (let i = 0; i < GUIDE_LIFECYCLE_STAGES.length; i += 1) {
    const stage = GUIDE_LIFECYCLE_STAGES[i]!;
    done[stage] = i < currentIndex;
  }
  const completed = GUIDE_LIFECYCLE_STAGES.filter((stage) => done[stage]);
  return { current, done, completed };
}

function hasAll(evidence: ProjectEvidenceState, kinds: ProjectEvidenceKind[]): boolean {
  return kinds.every((kind) => evidence.flags[kind] === true);
}

function hasAny(evidence: ProjectEvidenceState, kinds: ProjectEvidenceKind[] | undefined): boolean {
  if (!kinds?.length) return false;
  return kinds.some((kind) => evidence.flags[kind] === true);
}

/**
 * Advance at most one step if required evidence for the next edge is satisfied.
 * Call in a loop via applyProjectEvidence / reconcileProjectState.
 */
export function evaluateNextTransition(
  stage: GuideLifecycleStage,
  evidence: ProjectEvidenceState,
): ProjectTransitionRule | null {
  const rules = PROJECT_TRANSITION_RULES.filter((r) => r.from === stage);
  for (const rule of rules) {
    if (rule.blocking && hasAny(evidence, rule.blocking)) continue;
    if (!hasAll(evidence, rule.required)) continue;
    return rule;
  }
  return null;
}

/** Record evidence flags (idempotent). Does not advance stage by itself. */
export function recordProjectEvidence(
  evidence: ProjectEvidenceState,
  kinds: ProjectEvidenceKind[],
  at = new Date().toISOString(),
): ProjectEvidenceState {
  const next = normalizeEvidence(evidence);
  for (const kind of kinds) {
    next.flags[kind] = true;
    if (!next.at[kind]) next.at[kind] = at;
  }
  return next;
}

/**
 * Apply evidence then walk forward through unlocked transitions.
 * This is the ONLY function that may change guideStage.
 *
 * Default: one transition per apply so Proposal is not skipped when proposal.ready
 * also satisfies Proposal→Agreement. Payment may walk up to 3 steps.
 */
export function applyProjectEvidence(
  input: {
    stage: GuideLifecycleStage;
    evidence?: ProjectEvidenceState;
    agreementPaidAt?: string;
  },
  kinds: ProjectEvidenceKind[],
  at = new Date().toISOString(),
): ProjectStateApplyResult {
  const previous = input.stage;
  let stage = input.stage;
  let evidence = recordProjectEvidence(input.evidence, kinds, at);
  const newlyCompleted: GuideLifecycleStage[] = [];
  let celebration: { title: string; message: string } | undefined;
  let agreementPaidAt = input.agreementPaidAt;

  if (kinds.includes('payment.completed') && !agreementPaidAt) {
    agreementPaidAt = at;
  }

  const maxTransitions = kinds.includes('payment.completed') ? 3 : 1;

  for (let guard = 0; guard < maxTransitions; guard += 1) {
    const rule = evaluateNextTransition(stage, evidence);
    if (!rule) break;
    newlyCompleted.push(stage);
    stage = rule.to;
    celebration = rule.celebration ?? celebration;
  }

  return {
    changed: stage !== previous || newlyCompleted.length > 0,
    previous,
    stage,
    evidence,
    newlyCompleted,
    celebration,
    patch: {
      guideStage: stage,
      projectEvidence: evidence,
      ...(agreementPaidAt ? { agreementPaidAt } : {}),
    },
  };
}

/** Walk until stable (bootstrap / reconcile). */
export function reconcileProjectState(input: {
  stage: GuideLifecycleStage;
  evidence?: ProjectEvidenceState;
  agreementPaidAt?: string;
}): ProjectStateApplyResult {
  let stage = input.stage;
  let evidence = normalizeEvidence(input.evidence);
  let agreementPaidAt = input.agreementPaidAt;
  const newlyCompleted: GuideLifecycleStage[] = [];
  let celebration: { title: string; message: string } | undefined;
  const previous = input.stage;

  for (let guard = 0; guard < GUIDE_LIFECYCLE_STAGES.length; guard += 1) {
    const step = applyProjectEvidence(
      { stage, evidence, agreementPaidAt },
      [],
      agreementPaidAt ?? new Date().toISOString(),
    );
    if (!step.newlyCompleted.length && step.stage === stage) break;
    newlyCompleted.push(...step.newlyCompleted);
    stage = step.stage;
    evidence = step.evidence;
    agreementPaidAt = step.patch.agreementPaidAt ?? agreementPaidAt;
    celebration = step.celebration ?? celebration;
  }

  return {
    changed: stage !== previous || newlyCompleted.length > 0,
    previous,
    stage,
    evidence,
    newlyCompleted,
    celebration,
    patch: {
      guideStage: stage,
      projectEvidence: evidence,
      ...(agreementPaidAt ? { agreementPaidAt } : {}),
    },
  };
}

/**
 * Bootstrap canonical stage from LEGACY submission fields once.
 * Converts incidental data → evidence, then engine decides stage.
 * Explicitly ignores WPS proposalIds and does not treat siteUrl as Agreement/Design.
 */
export function bootstrapProjectStateFromLegacy(submission: CtpSubmission): ProjectStateApplyResult {
  const kinds: ProjectEvidenceKind[] = [];

  if (submission.portalSlug || submission.workspaceStatus === 'Active') {
    kinds.push('portal.bound');
  }

  const hasDiscovery =
    Boolean(submission.assessmentId) &&
    (Boolean(submission.intakeAnalysis?.summary) ||
      Boolean(submission.discoveryAnswers) ||
      Boolean(submission.digitalPresenceAudit));
  if (hasDiscovery) kinds.push('discovery.complete');

  if (
    submission.reviewScheduledAt ||
    submission.executiveSnapshot ||
    submission.executiveEmailDraft
  ) {
    kinds.push('strategy.ready');
  }

  if (isAuthoritativeProposalId(submission.proposalId)) {
    kinds.push('proposal.ready');
  }

  if (submission.agreementPaidAt) {
    kinds.push('payment.completed');
  }

  if (
    submission.studioStatus === 'In Progress' ||
    submission.studioStatus === 'Ready For Review' ||
    submission.studioStatus === 'Completed'
  ) {
    kinds.push('design.started');
  }

  if (submission.studioStatus === 'Ready For Review' || submission.studioStatus === 'Completed') {
    kinds.push('design.complete');
  }

  if (
    submission.studioStatus === 'Ready For Review' ||
    submission.studioStatus === 'Completed' ||
    Boolean(submission.productionPackage)
  ) {
    kinds.push('build.ready_for_review');
  }

  if (submission.status === 'Completed' || submission.status === 'Ready For Review') {
    // Ready For Review alone is build evidence, not review approval.
  }
  if (submission.status === 'Completed') {
    kinds.push('review.approved');
    kinds.push('project.launched');
  }

  // siteUrl / WPS / provisioning are intentionally NOT mapped to Agreement or Design.

  const seeded = applyProjectEvidence(
    {
      stage: submission.guideStage ?? 'Welcome',
      evidence: submission.projectEvidence,
      agreementPaidAt: submission.agreementPaidAt,
    },
    kinds,
    submission.updatedAt || new Date().toISOString(),
  );
  // Continue walking on accumulated evidence (Proposal→Agreement, etc.).
  return reconcileProjectState({
    stage: seeded.stage,
    evidence: seeded.evidence,
    agreementPaidAt: seeded.patch.agreementPaidAt ?? submission.agreementPaidAt,
  });
}

export function getCanonicalProjectStage(submission: CtpSubmission): GuideLifecycleStage {
  if (submission.guideStage && GUIDE_LIFECYCLE_STAGES.includes(submission.guideStage)) {
    return submission.guideStage;
  }
  return bootstrapProjectStateFromLegacy(submission).stage;
}

export function getProjectStateSnapshot(submission: CtpSubmission): ProjectStateSnapshot {
  const stage = getCanonicalProjectStage(submission);
  const evidence = normalizeEvidence(submission.projectEvidence);
  return {
    stage,
    evidence,
    resolution: resolutionFromCanonicalStage(stage),
  };
}
