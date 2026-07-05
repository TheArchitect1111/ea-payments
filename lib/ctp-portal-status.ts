import type {
  CtpStudioStatus,
  CtpSubmission,
  CtpSubmissionStatus,
  CtpWorkspaceStatus,
} from '@/lib/ctp-submissions';
import { buildCtpAdminAssetViews, type CtpAdminAssetView } from '@/lib/ctp-admin-view';

export type CtpTimelineStepState = 'complete' | 'active' | 'pending' | 'failed';

export type CtpTimelineStep = {
  id: 'submitted' | 'workspace' | 'studio' | 'review';
  label: string;
  detail: string;
  state: CtpTimelineStepState;
};

export type CtpPortalStatusView = {
  id: string;
  businessName: string;
  status: CtpSubmissionStatus;
  workspaceStatus: CtpWorkspaceStatus;
  studioStatus: CtpStudioStatus;
  reviewScheduledAt?: string;
  proposalId: string;
  submittedAt: string;
  intakeSummary?: string;
  assets: CtpAdminAssetView[];
  timeline: CtpTimelineStep[];
};

function workspaceStep(
  workspaceStatus: CtpWorkspaceStatus,
  status: CtpSubmissionStatus,
): Pick<CtpTimelineStep, 'state' | 'detail'> {
  if (workspaceStatus === 'Failed') {
    return { state: 'failed', detail: 'Workspace setup needs attention — our team has been notified.' };
  }
  if (workspaceStatus === 'Provisioning') {
    return { state: 'active', detail: 'Your workspace is opening now.' };
  }
  if (workspaceStatus === 'Active' || status === 'Workspace Active') {
    return { state: 'complete', detail: 'Your portal workspace is ready.' };
  }
  return { state: 'pending', detail: 'We will open your workspace after discovery review.' };
}

function studioStep(studioStatus: CtpStudioStatus): Pick<CtpTimelineStep, 'state' | 'detail'> {
  if (studioStatus === 'Completed') {
    return { state: 'complete', detail: 'Design studio work is complete.' };
  }
  if (studioStatus === 'Ready For Review') {
    return { state: 'complete', detail: 'Studios are ready for your collaborative review.' };
  }
  if (studioStatus === 'In Progress') {
    return { state: 'active', detail: 'Our team is shaping your first experience concepts.' };
  }
  return { state: 'pending', detail: 'Studio work begins after your workspace is active.' };
}

function reviewStep(
  status: CtpSubmissionStatus,
  reviewScheduledAt?: string,
): Pick<CtpTimelineStep, 'state' | 'detail'> {
  if (status === 'Completed') {
    return { state: 'complete', detail: 'Your CTP journey is complete — next builds are underway.' };
  }
  if (status === 'Review Scheduled' && reviewScheduledAt) {
    const when = new Date(reviewScheduledAt).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    return { state: 'active', detail: `Review scheduled for ${when}.` };
  }
  if (status === 'Ready For Review') {
    return { state: 'active', detail: 'We are scheduling your collaborative review.' };
  }
  return { state: 'pending', detail: 'We will schedule a review when studio work is ready.' };
}

export function buildCtpPortalStatusView(submission: CtpSubmission): CtpPortalStatusView {
  const workspace = workspaceStep(submission.workspaceStatus, submission.status);
  const studio = studioStep(submission.studioStatus);
  const review = reviewStep(submission.status, submission.reviewScheduledAt);

  return {
    id: submission.id,
    businessName: submission.businessName,
    status: submission.status,
    workspaceStatus: submission.workspaceStatus,
    studioStatus: submission.studioStatus,
    reviewScheduledAt: submission.reviewScheduledAt,
    proposalId: submission.proposalId,
    submittedAt: submission.submittedAt,
    intakeSummary: submission.intakeAnalysis?.summary,
    assets: buildCtpAdminAssetViews(submission.assetManifest),
    timeline: [
      {
        id: 'submitted',
        label: 'Discovery submitted',
        detail: 'Thank you — your answers are saved and our team is reviewing them.',
        state: 'complete',
      },
      {
        id: 'workspace',
        label: 'Workspace',
        ...workspace,
      },
      {
        id: 'studio',
        label: 'Design studio',
        ...studio,
      },
      {
        id: 'review',
        label: 'Collaborative review',
        ...review,
      },
    ],
  };
}
