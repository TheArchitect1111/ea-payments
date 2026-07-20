/**
 * Messages & Support — Guide-aware help for the client experience.
 */
import { ctpClientTypeLabel } from '@/lib/ctp-client-type';
import { buildCtpPortalStatusView } from '@/lib/ctp-portal-status';
import { buildGuideProgressView, type GuideProgressView } from '@/lib/ctp-guide-progress';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';
import type { CtpSubmission } from '@/lib/ctp-submissions';

const DEFAULT_CALENDLY =
  process.env.CALENDLY_URL ?? 'https://calendly.com/freedom-efficiencyarchitects/30min';

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
  if (guide.showDesignStudio) {
    pendingActions.push('Complete Design details on Progress when asked');
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
        : ['Nothing needed from you today — we’re advancing the project'],
    narrative: `${guide.headline} ${guide.summary}`.trim(),
    progressHref: designStudioPath(slug),
  };
}

export function buildCtpSupportView(submission: CtpSubmission, slug: string): CtpSupportView {
  const statusView = buildCtpPortalStatusView(submission);
  const guideView = buildGuideProgressView(slug, statusView);
  const guide = buildGuideContext(slug, guideView);

  const completed = submission.status === 'Completed';
  const ready =
    submission.status === 'Ready For Review' || submission.studioStatus === 'Ready For Review';

  let headline = `You're in ${guide.currentStage}`;
  let summary = guide.narrative;

  if (completed && submission.siteUrl) {
    headline = 'Care — we’re still with you';
    summary =
      'Your project is live. Reach out anytime — we already know where you are and what’s next.';
  } else if (ready) {
    headline = 'We’re ready when you are';
    summary =
      'Your reviewable work is prepared. Message us with questions, or open Progress for your next step.';
  } else if (submission.reviewScheduledAt) {
    headline = 'Help before your conversation';
    summary = `Your strategy conversation is scheduled for ${new Date(
      submission.reviewScheduledAt,
    ).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })}. Send context ahead of time — Progress already reflects the booking.`;
  }

  const actions: CtpSupportAction[] = [
    {
      id: 'progress',
      title: 'Open Your Project',
      detail: guide.nothingRequired
        ? 'See where you are and what’s happening now — nothing required from you today.'
        : `Next step: ${guide.nbaLabel}`,
      href: guide.progressHref,
      primary: true,
    },
    {
      id: 'message',
      title: 'Message your advisor',
      detail: 'Send a question or file — we’ll reply with your project context already in hand.',
      href: `/portal/${slug}/updates/new`,
    },
    {
      id: 'activity',
      title: 'View activity & replies',
      detail: 'See outreach and advisor responses in one timeline.',
      href: `/portal/${slug}/updates`,
    },
    {
      id: 'schedule',
      title: 'Scheduling',
      detail: 'Confirmed conversation time and booking.',
      href: `/portal/${slug}/ctp/schedule`,
    },
    {
      id: 'documents',
      title: 'Documents',
      detail: 'Everything prepared for you, with why / when / what happens next.',
      href: `/portal/${slug}/ctp/documents`,
    },
    {
      id: 'email',
      title: 'Email support',
      detail: DEFAULT_SUPPORT_EMAIL,
      href: `mailto:${DEFAULT_SUPPORT_EMAIL}`,
      external: true,
    },
    {
      id: 'calendly',
      title: 'Book strategy conversation',
      detail: 'Direct booking with your team.',
      href: DEFAULT_CALENDLY,
      external: true,
    },
  ];

  return {
    businessName: submission.businessName,
    clientTypeLabel: submission.clientType
      ? ctpClientTypeLabel(submission.clientType)
      : undefined,
    status: guide.currentStage,
    headline,
    summary,
    supportEmail: DEFAULT_SUPPORT_EMAIL,
    calendlyUrl: DEFAULT_CALENDLY,
    actions,
    guide,
  };
}
