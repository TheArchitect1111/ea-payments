/**
 * Messages & Support — Guide-driven help. No independent workflow CTAs.
 */
import { ctpClientTypeLabel } from '@/lib/ctp-client-type';
import { buildCtpPortalStatusView } from '@/lib/ctp-portal-status';
import { buildGuideProgressView, type GuideProgressView } from '@/lib/ctp-guide-progress';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';
import type { CtpSubmission } from '@/lib/ctp-submissions';

const DEFAULT_SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL ?? 'freedom@efficiencyarchitects.online';

export type CtpSupportAction = {
  id: string;
  title: string;
  detail: string;
  href: string;
  external?: boolean;
  primary?: boolean;
};

export type CtpSupportGuideContext = {
  currentStage: string;
  recentMilestones: string[];
  nbaLabel: string;
  nbaWhy: string;
  nothingRequired: boolean;
  pendingActions: string[];
  narrative: string;
  behindTheScenes: string;
  confidenceMessage: string;
  progressHref: string;
};

export type CtpSupportView = {
  businessName: string;
  clientTypeLabel?: string;
  status: string;
  headline: string;
  summary: string;
  supportEmail: string;
  calendlyUrl: string;
  actions: CtpSupportAction[];
  guide: CtpSupportGuideContext;
};

function buildGuideContext(slug: string, guide: GuideProgressView): CtpSupportGuideContext {
  const pendingActions: string[] = [];
  if (!guide.nba.nothingRequired) {
    pendingActions.push(guide.nba.label);
  }

  return {
    currentStage: guide.currentStage,
    recentMilestones: guide.completed.slice(-3).map((m) => m.title),
    nbaLabel: guide.nba.label,
    nbaWhy: guide.nba.why,
    nothingRequired: guide.nba.nothingRequired,
    pendingActions:
      pendingActions.length > 0
        ? pendingActions
        : ["We've got everything we need — nothing required from you today"],
    narrative: `${guide.headline} ${guide.summary}`.trim(),
    behindTheScenes: guide.behindTheScenes,
    confidenceMessage: guide.confidenceMessage,
    progressHref: designStudioPath(slug),
  };
}

export function buildCtpSupportView(submission: CtpSubmission, slug: string): CtpSupportView {
  const statusView = buildCtpPortalStatusView(submission);
  const guideView = buildGuideProgressView(slug, statusView);
  const guide = buildGuideContext(slug, guideView);

  let headline = `You're in ${guide.currentStage}`;
  let summary = guide.narrative;

  if (guide.nothingRequired) {
    headline = "We've got everything we need";
    summary = `${guide.confidenceMessage} ${guide.behindTheScenes}`.trim();
  } else if (guideView.nba.kind === 'meeting') {
    headline = 'A conversation will keep us aligned';
    summary = `${guide.nbaLabel}. ${guide.nbaWhy}`;
  } else {
    headline = `You're in ${guide.currentStage}`;
    summary = `${guide.narrative} Next: ${guide.nbaLabel}.`;
  }

  const actions: CtpSupportAction[] = [
    {
      id: 'progress',
      title: guide.nothingRequired ? 'Open Your Project' : guide.nbaLabel,
      detail: guide.nothingRequired
        ? "See where you are and what we're doing — nothing required from you today."
        : guide.nbaWhy,
      href: guide.nothingRequired
        ? guide.progressHref
        : guideView.nba.href || guide.progressHref,
      primary: true,
      external: !guide.nothingRequired ? guideView.nba.external : undefined,
    },
    {
      id: 'email',
      title: 'Email support',
      detail: DEFAULT_SUPPORT_EMAIL,
      href: `mailto:${DEFAULT_SUPPORT_EMAIL}`,
      external: true,
    },
  ];

  // Contact/help only when idle — no Calendly, Schedule, or Update Hub prompts.
  if (!guide.nothingRequired) {
    actions.push({
      id: 'message',
      title: 'Message your advisor',
      detail: 'Send a question — we already know your stage and next step.',
      href: `/portal/${slug}/ctp/messages`,
    });
    actions.push({
      id: 'documents',
      title: 'Documents',
      detail: 'Everything prepared for you, with why / when / what happens next.',
      href: `/portal/${slug}/ctp/documents`,
    });
  } else {
    actions.push({
      id: 'message',
      title: 'Ask a question anytime',
      detail: 'Optional — only if something comes up. No action is required.',
      href: `/portal/${slug}/ctp/messages`,
    });
  }

  return {
    businessName: submission.businessName,
    clientTypeLabel: submission.clientType
      ? ctpClientTypeLabel(submission.clientType)
      : undefined,
    status: guide.currentStage,
    headline,
    summary,
    supportEmail: DEFAULT_SUPPORT_EMAIL,
    calendlyUrl: '',
    actions,
    guide,
  };
}
