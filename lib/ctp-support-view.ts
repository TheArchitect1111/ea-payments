/**
 * CTP Messages & Support hub — contextual help for the CTP journey.
 */
import { ctpClientTypeLabel } from '@/lib/ctp-client-type';
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

export type CtpSupportView = {
  businessName: string;
  clientTypeLabel?: string;
  status: string;
  headline: string;
  summary: string;
  supportEmail: string;
  calendlyUrl: string;
  actions: CtpSupportAction[];
};

export function buildCtpSupportView(submission: CtpSubmission, slug: string): CtpSupportView {
  const completed = submission.status === 'Completed';
  const ready =
    submission.status === 'Ready For Review' || submission.studioStatus === 'Ready For Review';

  let headline = 'Messages & support';
  let summary =
    'Reach your EA team, ask a question, or book time — without leaving your Consider the Possibilities workspace.';

  if (completed) {
    headline = 'Support after reveal';
    summary =
      'Your transformation is unlocked. Message the team, book a follow-up, or revisit your deliverables anytime.';
  } else if (ready) {
    headline = 'We are ready when you are';
    summary =
      'Your package is ready for review. Message us with questions or book the strategy session to walk through it together.';
  } else if (submission.reviewScheduledAt) {
    headline = 'Help before your review';
    summary = `Your review is scheduled for ${new Date(submission.reviewScheduledAt).toLocaleString(
      'en-US',
      { dateStyle: 'medium', timeStyle: 'short' },
    )}. Send context ahead of time or adjust via scheduling.`;
  }

  const actions: CtpSupportAction[] = [
    {
      id: 'message',
      title: 'Message your advisor',
      detail: 'Tracked update to the EA team — best for questions, files, and decisions.',
      href: `/portal/${slug}/updates/new`,
      primary: true,
    },
    {
      id: 'activity',
      title: 'View activity & replies',
      detail: 'See outreach and advisor responses in one timeline.',
      href: `/portal/${slug}/updates`,
    },
    {
      id: 'ask',
      title: 'Ask a quick question',
      detail: 'Short-form guidance for non-urgent items.',
      href: `/portal/${slug}/ask`,
    },
    {
      id: 'schedule',
      title: 'Scheduling & strategy session',
      detail: 'Confirmed review time and Calendly booking.',
      href: `/portal/${slug}/ctp/schedule`,
    },
    {
      id: 'documents',
      title: 'Document vault',
      detail: 'Deliverables and uploads in one place.',
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
      title: 'Book strategy session',
      detail: 'Direct Calendly booking with the EA team.',
      href: DEFAULT_CALENDLY,
      external: true,
    },
  ];

  return {
    businessName: submission.businessName,
    clientTypeLabel: submission.clientType
      ? ctpClientTypeLabel(submission.clientType)
      : undefined,
    status: submission.status,
    headline,
    summary,
    supportEmail: DEFAULT_SUPPORT_EMAIL,
    calendlyUrl: DEFAULT_CALENDLY,
    actions,
  };
}
