import {
  getCtpSubmissionById,
  listCtpSubmissions,
  updateCtpSubmission,
  type CtpSubmission,
} from '@/lib/ctp-submissions';
import { sendCtpReviewReminderEmail } from '@/lib/email';
import { publicPortalUrl } from '@/lib/ctp-portal-host';
import { emitPulseEvent } from '@/lib/pulse-bus';

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_WINDOW_MIN_MS = 20 * 60 * 60 * 1000;
const REMINDER_WINDOW_MAX_MS = 28 * 60 * 60 * 1000;

export async function sendCtpReviewReminderForSubmission(
  submission: CtpSubmission,
  options?: { force?: boolean },
): Promise<{ ok: boolean; sent: boolean; error?: string }> {
  if (!submission.email?.trim()) {
    return { ok: false, sent: false, error: 'Submission has no email.' };
  }
  if (!submission.reviewScheduledAt) {
    return { ok: false, sent: false, error: 'No review scheduled.' };
  }
  if (submission.reviewReminderSentAt && !options?.force) {
    return { ok: true, sent: false };
  }

  const when = new Date(submission.reviewScheduledAt);
  if (Number.isNaN(when.getTime())) {
    return { ok: false, sent: false, error: 'Invalid review datetime.' };
  }

  const portalUrl = submission.portalSlug
    ? publicPortalUrl(submission.portalSlug, 'ctp')
    : publicPortalUrl('demo-client', 'ctp');

  const emailResult = await sendCtpReviewReminderEmail({
    email: submission.email,
    contactName: submission.contactName,
    businessName: submission.businessName,
    reviewScheduledAt: submission.reviewScheduledAt,
    portalUrl,
  });

  if (!emailResult.ok) {
    return { ok: false, sent: false, error: emailResult.error ?? 'Reminder email failed.' };
  }

  await updateCtpSubmission(submission.id, {
    reviewReminderSentAt: new Date().toISOString(),
  });

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'ctp.review.reminder_sent',
    title: `CTP review reminder sent — ${submission.businessName}`,
    detail: when.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    priority: 'low',
    href: '/admin/ctp',
    tenantId: submission.considerSlug ?? submission.portalSlug,
    objectId: submission.id,
    metadata: {
      ctpSubmissionId: submission.id,
      reviewScheduledAt: submission.reviewScheduledAt,
    },
  });

  return { ok: true, sent: true };
}

/** Cron helper — remind when review is ~24h away and not yet reminded. */
export async function processDueCtpReviewReminders(): Promise<{
  checked: number;
  sent: number;
  errors: number;
}> {
  const now = Date.now();
  const submissions = await listCtpSubmissions(200);
  let sent = 0;
  let errors = 0;
  let checked = 0;

  for (const submission of submissions) {
    if (submission.status !== 'Review Scheduled' || !submission.reviewScheduledAt) continue;
    if (submission.reviewReminderSentAt) continue;

    const when = new Date(submission.reviewScheduledAt).getTime();
    if (Number.isNaN(when)) continue;

    const delta = when - now;
    if (delta < REMINDER_WINDOW_MIN_MS || delta > REMINDER_WINDOW_MAX_MS) continue;

    checked += 1;
    const result = await sendCtpReviewReminderForSubmission(submission);
    if (result.sent) sent += 1;
    else if (!result.ok) errors += 1;
  }

  return { checked, sent, errors };
}

export async function scheduleCtpReview(
  submissionId: string,
  reviewScheduledAt: string,
): Promise<{ ok: boolean; error?: string; submission?: CtpSubmission; reminderSent?: boolean }> {
  const when = new Date(reviewScheduledAt);
  if (Number.isNaN(when.getTime())) {
    return { ok: false, error: 'Invalid review datetime.' };
  }

  const submission = await getCtpSubmissionById(submissionId);
  if (!submission) {
    return { ok: false, error: 'CTP submission not found.' };
  }

  const iso = when.toISOString();
  const updated = await updateCtpSubmission(submissionId, {
    reviewScheduledAt: iso,
    status: 'Review Scheduled',
    reviewReminderSentAt: undefined,
  });

  if (!updated.submission) {
    return { ok: false, error: updated.error ?? 'Could not update submission.' };
  }

  try {
    await emitPulseEvent({
      product: 'ea-platform',
      type: 'ctp.review.scheduled',
      title: `CTP review scheduled — ${submission.businessName}`,
      detail: when.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      priority: 'medium',
      href: '/admin/ctp',
      tenantId: submission.considerSlug,
      objectId: submission.id,
      metadata: {
        ctpSubmissionId: submission.id,
        reviewScheduledAt: iso,
        proposalId: submission.proposalId,
      },
    });
  } catch (err) {
    console.error('[ctp-review-schedule] pulse failed:', err);
  }

  let reminderSent = false;
  const hoursAway = (when.getTime() - Date.now()) / (60 * 60 * 1000);
  // Immediate confirmation-style reminder when scheduled more than 24h out.
  if (hoursAway > 24) {
    const reminder = await sendCtpReviewReminderForSubmission(
      { ...updated.submission, reviewScheduledAt: iso, reviewReminderSentAt: undefined },
      { force: true },
    );
    reminderSent = reminder.sent;
  }

  const refreshed = await getCtpSubmissionById(submissionId);
  return { ok: true, submission: refreshed ?? updated.submission, reminderSent };
}

export { DAY_MS };
