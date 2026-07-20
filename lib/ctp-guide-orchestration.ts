/**
 * Guided Project Orchestration — conductor over CTP status changes.
 * Plans side effects from stage transitions; Progress remains a read adapter.
 * No auth, routing, or provisioning changes.
 */
import type { CtpSubmission } from '@/lib/ctp-submissions';
import { buildCtpPortalStatusView, type CtpPortalStatusView } from '@/lib/ctp-portal-status';
import { buildGuideProgressView, type GuideProgressView } from '@/lib/ctp-guide-progress';
import {
  detectGuideTransition,
  GUIDE_STAGE_DEFINITIONS,
  resolveGuideStages,
  type GuideLifecycleStage,
  type GuideStageTransition,
} from '@/lib/ctp-guide-stage-engine';
import {
  guideCelebratePulse,
  guideClientEmail,
  guideMilestonePulse,
  guideNoticeForCompletedStage,
  guideStageAdvancedPulse,
} from '@/lib/ctp-guide-notifications';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';
import type { PulseEvent } from '@/lib/pulse-bus';
import { dispatchNotification } from '@/lib/notify-dispatch';

export type GuideTimelineEntry = {
  id: string;
  stage: GuideLifecycleStage;
  title: string;
  at: string;
  whatHappened: string;
};

export type GuideOrchestrationEffect =
  | { kind: 'pulse'; event: PulseEvent; dedupeKey: string }
  | { kind: 'email'; to: string; subject: string; html: string; dedupeKey: string }
  | {
      kind: 'celebrate';
      stage: GuideLifecycleStage;
      title: string;
      message: string;
      dedupeKey: string;
    }
  | { kind: 'timeline'; entry: GuideTimelineEntry; dedupeKey: string };

export type GuideOrchestrationPlan = {
  transition: GuideStageTransition | null;
  effects: GuideOrchestrationEffect[];
  view: GuideProgressView;
  celebrationMessage?: string;
};

/** In-process idempotency for retries / duplicate patches. */
const appliedKeys = new Set<string>();
const APPLIED_CAP = 2000;

function remember(key: string): boolean {
  if (appliedKeys.has(key)) return false;
  appliedKeys.add(key);
  if (appliedKeys.size > APPLIED_CAP) {
    const first = appliedKeys.values().next().value;
    if (first) appliedKeys.delete(first);
  }
  return true;
}

export function __resetGuideOrchestrationDedupeForTests(): void {
  appliedKeys.clear();
}

function buildTimelineEntries(
  submissionId: string,
  at: string,
  stages: GuideLifecycleStage[],
): GuideTimelineEntry[] {
  return stages.map((stage) => {
    const def = GUIDE_STAGE_DEFINITIONS[stage];
    return {
      id: `${submissionId}:${stage}:complete`,
      stage,
      title: def.celebration?.title ?? `${stage} Complete`,
      at,
      whatHappened:
        def.notification?.detail ??
        def.celebration?.message ??
        `${stage} is complete.`,
    };
  });
}

/**
 * Pure planner — no I/O. Diffs previous vs next portal status views.
 */
export function planGuideOrchestration(input: {
  slug: string;
  submissionId: string;
  businessName: string;
  email?: string;
  prev?: CtpPortalStatusView;
  next: CtpPortalStatusView;
  at?: string;
}): GuideOrchestrationPlan {
  const at = input.at ?? new Date().toISOString();
  const nextStages = resolveGuideStages(input.next);
  const view = buildGuideProgressView(input.slug, input.next);

  if (!input.prev) {
    return {
      transition: null,
      effects: [],
      view,
      celebrationMessage: view.celebrationMessage,
    };
  }

  const prevStages = resolveGuideStages(input.prev);
  const transition = detectGuideTransition(prevStages, nextStages);
  if (!transition) {
    return {
      transition: null,
      effects: [],
      view,
      celebrationMessage: view.celebrationMessage,
    };
  }

  const effects: GuideOrchestrationEffect[] = [];
  const slug = input.slug;
  const progressHref = slug ? designStudioPath(slug) : '';

  if (transition.from !== transition.to) {
    const dedupeKey = `${input.submissionId}:advance:${transition.from}->${transition.to}`;
    effects.push({
      kind: 'pulse',
      dedupeKey,
      event: guideStageAdvancedPulse({
        submissionId: input.submissionId,
        portalSlug: slug,
        businessName: input.businessName,
        from: transition.from,
        to: transition.to,
        newlyCompleted: transition.newlyCompleted,
      }),
    });
  }

  for (const stage of transition.newlyCompleted) {
    const notice = guideNoticeForCompletedStage(stage);
    if (!notice) continue;

    const timelineEntries = buildTimelineEntries(input.submissionId, at, [stage]);
    for (const entry of timelineEntries) {
      effects.push({
        kind: 'timeline',
        dedupeKey: `${entry.id}:timeline`,
        entry,
      });
    }

    effects.push({
      kind: 'pulse',
      dedupeKey: `${input.submissionId}:${stage}:milestone`,
      event: guideMilestonePulse({
        submissionId: input.submissionId,
        portalSlug: slug,
        businessName: input.businessName,
        stage,
        notice,
      }),
    });

    if (notice.celebrationTitle && notice.celebrationMessage) {
      effects.push({
        kind: 'celebrate',
        dedupeKey: `${input.submissionId}:${stage}:celebrate`,
        stage,
        title: notice.celebrationTitle,
        message: notice.celebrationMessage,
      });
      effects.push({
        kind: 'pulse',
        dedupeKey: `${input.submissionId}:${stage}:celebrate-pulse`,
        event: guideCelebratePulse({
          submissionId: input.submissionId,
          portalSlug: slug,
          stage,
          notice,
        }),
      });
    }

    // Email only for high-signal client moments (avoid inbox noise).
    const emailStages = new Set<GuideLifecycleStage>([
      'Proposal',
      'Agreement',
      'Build',
      'Launch',
    ]);
    if (input.email && emailStages.has(stage) && progressHref) {
      const mail = guideClientEmail({
        to: input.email,
        businessName: input.businessName,
        notice,
        progressHref,
      });
      effects.push({
        kind: 'email',
        dedupeKey: `${input.submissionId}:${stage}:email`,
        ...mail,
      });
    }
  }

  const latestCelebrate = [...effects]
    .reverse()
    .find((e): e is Extract<GuideOrchestrationEffect, { kind: 'celebrate' }> => e.kind === 'celebrate');

  return {
    transition,
    effects,
    view: {
      ...view,
      celebrationMessage:
        latestCelebrate?.message ?? view.celebrationMessage,
    },
    celebrationMessage: latestCelebrate?.message ?? view.celebrationMessage,
  };
}

/** Apply planned effects via Pulse / email. Idempotent per dedupe key. */
export async function applyGuideOrchestration(
  plan: GuideOrchestrationPlan,
): Promise<{ applied: number; skipped: number }> {
  let applied = 0;
  let skipped = 0;

  for (const effect of plan.effects) {
    if (!remember(effect.dedupeKey)) {
      skipped += 1;
      continue;
    }

    try {
      if (effect.kind === 'pulse') {
        await dispatchNotification({ pulse: effect.event });
        applied += 1;
      } else if (effect.kind === 'email') {
        await dispatchNotification({
          email: { to: effect.to, subject: effect.subject, html: effect.html },
        });
        applied += 1;
      } else if (effect.kind === 'celebrate' || effect.kind === 'timeline') {
        // Timeline/celebrate are durable via Pulse + Progress recompute.
        applied += 1;
      }
    } catch (err) {
      console.error('[guide-orchestration] effect failed:', effect.kind, err);
    }
  }

  return { applied, skipped };
}

/**
 * Hook after CTP submission mutation — fire-and-forget safe.
 * Recalculates Guide stage, NBA, notifications, celebrations, timeline.
 */
export async function orchestrateGuideAfterSubmissionUpdate(
  previous: CtpSubmission,
  next: CtpSubmission,
): Promise<GuideOrchestrationPlan> {
  const prevView = buildCtpPortalStatusView(previous);
  const nextView = buildCtpPortalStatusView(next);
  const slug = (next.portalSlug ?? previous.portalSlug ?? '').trim();

  const plan = planGuideOrchestration({
    slug,
    submissionId: next.id,
    businessName: next.businessName || previous.businessName,
    email: next.email || previous.email,
    prev: prevView,
    next: nextView,
    at: next.updatedAt,
  });

  if (plan.effects.length) {
    await applyGuideOrchestration(plan);
  }

  return plan;
}
