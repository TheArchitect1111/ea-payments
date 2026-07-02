/** CTP attention stats for Mission Control — stub until full CTP submissions ship on this branch. */

export type CtpAttentionStats = {
  workspacesPending: number;
  studiosInProgress: number;
  studiosReadyForReview: number;
  reviewsScheduled: number;
};

export async function getCtpAttentionStats(): Promise<CtpAttentionStats> {
  return {
    workspacesPending: 0,
    studiosInProgress: 0,
    studiosReadyForReview: 0,
    reviewsScheduled: 0,
  };
}
