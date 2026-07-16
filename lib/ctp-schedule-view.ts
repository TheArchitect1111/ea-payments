/**
 * Client-facing CTP scheduling — Opportunity Review + Calendly CTA.
 */
import { ctpCalendlyUrl } from '@/lib/ctp-calendly';
import { ctpClientTypeLabel } from '@/lib/ctp-client-type';
import type { CtpSubmission } from '@/lib/ctp-submissions';

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

  let headline = 'Schedule your Opportunity Review';
  let summary =
    'Book time to walk through your Opportunity Dashboard — findings, recommendations, and investment expectations prepared specifically for your organization.';

  if (completed) {
    headline = 'Keep the momentum';
    summary =
      'Your transformation is unlocked. Book a follow-up Opportunity Review anytime you want a guided next move.';
  } else if (reviewLabel) {
    headline = 'Your Opportunity Review is on the calendar';
    summary = `We have you scheduled for ${reviewLabel}. You can also book an additional session if you need another slot.`;
  } else if (
    submission.status === 'Ready For Review' ||
    submission.studioStatus === 'Ready For Review'
  ) {
    headline = 'Ready for your Opportunity Review';
    summary =
      'Your analysis package is ready. Schedule an Opportunity Review so we can walk through recommendations together.';
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
    calendlyUrl: ctpCalendlyUrl(),
    completed,
  };
}
