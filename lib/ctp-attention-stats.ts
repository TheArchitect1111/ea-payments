import { listCtpSubmissions } from '@/lib/ctp-submissions';

export type CtpAttentionStats = {
  workspacesPending: number;
  studiosInProgress: number;
  studiosReadyForReview: number;
  reviewsScheduled: number;
};

export async function getCtpAttentionStats(): Promise<CtpAttentionStats> {
  const submissions = await listCtpSubmissions(200);

  return {
    workspacesPending: submissions.filter(
      (s) => s.workspaceStatus === 'Pending' || s.workspaceStatus === 'Failed',
    ).length,
    studiosInProgress: submissions.filter((s) => s.studioStatus === 'In Progress').length,
    studiosReadyForReview: submissions.filter(
      (s) => s.studioStatus === 'Ready For Review' || s.status === 'Ready For Review',
    ).length,
    reviewsScheduled: submissions.filter(
      (s) => s.status === 'Review Scheduled' || Boolean(s.reviewScheduledAt),
    ).length,
  };
}
