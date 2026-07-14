/**
 * Client-facing CTP scheduling view — review appointment + strategy session CTA.
 */
import { ctpClientTypeLabel } from '@/lib/ctp-client-type';
import type { CtpSubmission } from '@/lib/ctp-submissions';

const DEFAULT_CALENDLY =
  process.env.CALENDLY_URL ?? 'https://calendly.com/freedom-efficiencyarchitects/30min';

export type CtpScheduleView = {
  businessName: string;
  clientTypeLabel?: string;
  status: string;
  reviewScheduledAt?: string;
  reviewLabel?: string;
  headline: string;
  summary: string;
  calendlyUrl: string;
  completed: boolean;
};

export function buildCtpScheduleView(submission: CtpSubmission): CtpScheduleView {
  const completed = submission.status === 'Completed';
  const reviewScheduledAt = submission.reviewScheduledAt;
  const reviewLabel = reviewScheduledAt
    ? new Date(reviewScheduledAt).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      })
    : undefined;

  let headline = 'Schedule your strategy session';
  let summary =
    'Book time with the EA team to review your Executive Snapshot, recommendations, and production package.';

  if (completed) {
    headline = 'Reveal complete — keep the momentum';
    summary =
      'Your transformation is unlocked. Book a follow-up strategy session anytime you want a guided next move.';
  } else if (reviewLabel) {
    headline = 'Your review is on the calendar';
    summary = `We have you scheduled for ${reviewLabel}. You can also book an additional strategy session if you need another slot.`;
  } else if (submission.status === 'Ready For Review' || submission.studioStatus === 'Ready For Review') {
    headline = 'Ready for executive review';
    summary =
      'Your package is ready. Book a strategy session so we can walk the reveal path together, or wait for EA to confirm a review time.';
  }

  return {
    businessName: submission.businessName,
    clientTypeLabel: submission.clientType
      ? ctpClientTypeLabel(submission.clientType)
      : undefined,
    status: submission.status,
    reviewScheduledAt,
    reviewLabel,
    headline,
    summary,
    calendlyUrl: DEFAULT_CALENDLY,
    completed,
  };
}
