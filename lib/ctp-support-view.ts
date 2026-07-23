/**
 * Help & Contact — Guide-driven help for Client Experience. No independent workflow CTAs.
 */
import { ctpClientTypeLabel } from '@/lib/ctp-client-type';
import { buildCtpPortalStatusView } from '@/lib/ctp-portal-status';
import { buildGuideProgressView, type GuideProgressView } from '@/lib/ctp-guide-progress';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';
import type { CtpSubmission } from '@/lib/ctp-submissions';

const DEFAULT_SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL ?? 'freedom@efficiencyarchitects.online';

const SUPPORT_HOURS = 'Monday–Friday, 9:00am–5:00pm Eastern';
const SUPPORT_RESPONSE = 'We typically respond within one business day.';
const SUPPORT_URGENT =
  'For urgent live-site issues, email us and include “Urgent” in the subject. We’ll prioritize during business hours.';

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
  supportHours: string;
  supportResponse: string;
  supportUrgent: string;
  helpMailto: string;
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
        : ["You're all set for now — nothing is needed from you today"],
    narrative: `${guide.headline} ${guide.summary}`.trim(),
    behindTheScenes: guide.behindTheScenes,
    confidenceMessage: guide.confidenceMessage,
    progressHref: designStudioPath(slug),
  };
}

function buildHelpMailto(input: {
  email: string;
  businessName: string;
  slug: string;
  stage: string;
  page: string;
}): string {
  const subject = encodeURIComponent(
    `Help request — ${input.businessName} — ${input.stage}`,
  );
  const body = encodeURIComponent(
    [
      'Hi Efficiency Architects,',
      '',
      'I need help with my project.',
      '',
      `Client: ${input.businessName}`,
      `Portal: ${input.slug}`,
      `Current stage: ${input.stage}`,
      `Page: ${input.page}`,
      '',
      'Here’s what I need:',
      '',
    ].join('\n'),
  );
  return `mailto:${input.email}?subject=${subject}&body=${body}`;
}

export function buildCtpSupportView(
  submission: CtpSubmission,
  slug: string,
  options?: { pagePath?: string },
): CtpSupportView {
  const statusView = buildCtpPortalStatusView(submission);
  const guideView = buildGuideProgressView(slug, statusView);
  const guide = buildGuideContext(slug, guideView);
  const pagePath = options?.pagePath ?? `/portal/${slug}/ctp/support`;

  let headline = `You're in ${guide.currentStage}`;
  let summary = guide.narrative;

  if (guide.nothingRequired) {
    headline = "You're all set for now";
    summary = `${guide.confidenceMessage} Need us anyway? Send a message and we’ll respond within one business day.`;
  } else if (guideView.nba.kind === 'meeting') {
    headline = 'A conversation will keep us aligned';
    summary = `${guide.nbaLabel}. ${guide.nbaWhy}`;
  } else {
    headline = `You're in ${guide.currentStage}`;
    summary = `${guide.narrative} Next: ${guide.nbaLabel}.`;
  }

  const helpMailto = buildHelpMailto({
    email: DEFAULT_SUPPORT_EMAIL,
    businessName: submission.businessName || slug,
    slug,
    stage: guide.currentStage,
    page: pagePath,
  });

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
      title: 'Contact your guide',
      detail: `${DEFAULT_SUPPORT_EMAIL} · ${SUPPORT_RESPONSE}`,
      href: helpMailto,
      external: true,
    },
  ];

  // Contact/help only when idle — no Calendly, Schedule, or Update Hub prompts.
  if (!guide.nothingRequired) {
    actions.push({
      id: 'message',
      title: 'Contact your guide',
      detail: 'Email a question — we already know your stage and next step.',
      href: `/portal/${slug}/ctp/messages`,
    });
    actions.push({
      id: 'documents',
      title: 'Documents',
      detail: 'Your proposal and project documents are ready here when prepared.',
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
    supportHours: SUPPORT_HOURS,
    supportResponse: SUPPORT_RESPONSE,
    supportUrgent: SUPPORT_URGENT,
    helpMailto,
    calendlyUrl: '',
    actions,
    guide,
  };
}
