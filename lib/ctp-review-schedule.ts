import {
  getCtpSubmissionById,
  updateCtpSubmission,
  type CtpSubmission,
} from '@/lib/ctp-submissions';
import { emitPulseEvent } from '@/lib/pulse-bus';

export async function scheduleCtpReview(
  submissionId: string,
  reviewScheduledAt: string,
): Promise<{ ok: boolean; error?: string; submission?: CtpSubmission }> {
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

  return { ok: true, submission: updated.submission };
}
