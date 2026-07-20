import type {
  CtpStudioStatus,
  CtpSubmission,
  CtpSubmissionStatus,
  CtpWorkspaceStatus,
} from '@/lib/ctp-submissions';
import { buildCtpAdminAssetViews, type CtpAdminAssetView } from '@/lib/ctp-admin-view';
import { ctpClientTypeLabel } from '@/lib/ctp-client-type';

export type CtpTimelineStepState = 'complete' | 'active' | 'pending' | 'failed';

export type CtpTimelineStepId =
  | 'assessment'
  | 'ai-evaluation'
  | 'digital-audit'
  | 'executive-report'
  | 'client-input'
  | 'ai-building'
  | 'executive-review'
  | 'reveal';

export type CtpTimelineStep = {
  id: CtpTimelineStepId;
  label: string;
  detail: string;
  state: CtpTimelineStepState;
};

export type CtpDesignStudioItem = {
  id: string;
  label: string;
  status: 'ready' | 'needed';
  detail: string;
};

export type CtpProductionArtifactView = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
};

export type CtpPortalStatusView = {
  id: string;
  businessName: string;
  status: CtpSubmissionStatus;
  workspaceStatus: CtpWorkspaceStatus;
  studioStatus: CtpStudioStatus;
  /** Canonical Guide stage from Project State Engine SSOT. */
  guideStage?: import('@/lib/project-state-engine').GuideLifecycleStage;
  reviewScheduledAt?: string;
  proposalId: string;
  submittedAt: string;
  intakeSummary?: string;
  clientTypeLabel?: string;
  siteUrl?: string;
  digitalScore?: number;
  socialScore?: number;
  gbpScore?: number;
  maturityScore?: number;
  adminWastePercent?: number;
  snapshotSummary?: string;
  percentComplete: number;
  productionHeadline?: string;
  productionStack?: string[];
  productionArtifacts?: CtpProductionArtifactView[];
  assets: CtpAdminAssetView[];
  timeline: CtpTimelineStep[];
  designStudio: CtpDesignStudioItem[];
  designStudioFields?: {
    brand_colors?: string;
    brand_fonts?: string;
    brand_voice?: string;
    competitors?: string;
    inspiration?: string;
    offer_summary?: string;
  };
};

function step(
  id: CtpTimelineStepId,
  label: string,
  state: CtpTimelineStepState,
  detail: string,
): CtpTimelineStep {
  return { id, label, state, detail };
}

function hasClientInput(submission: CtpSubmission, assets: CtpAdminAssetView[]): boolean {
  if (assets.length > 0) return true;
  const answers = submission.discoveryAnswers ?? {};
  const brandHints = ['brand_voice', 'brand_colors', 'logo', 'inspiration', 'competitors'];
  return brandHints.some((key) => {
    const value = answers[key];
    if (typeof value === 'string' && value.trim()) return true;
    if (Array.isArray(value) && value.length) return true;
    return false;
  });
}

function buildTimeline(submission: CtpSubmission, assets: CtpAdminAssetView[]): CtpTimelineStep[] {
  const intakeDone = Boolean(submission.intakeAnalysis?.summary);
  const digitalDone = Boolean(submission.digitalPresenceAudit);
  const reportDone = Boolean(submission.proposalId || submission.executiveSnapshot);
  const workspaceActive = submission.workspaceStatus === 'Active';
  const workspaceFailed = submission.workspaceStatus === 'Failed';
  const siteLive = Boolean(submission.siteUrl);
  const studioInProgress = submission.studioStatus === 'In Progress';
  const studioReady =
    submission.studioStatus === 'Ready For Review' || submission.studioStatus === 'Completed';
  const productionReady = Boolean(submission.productionPackage?.artifacts?.length);
  const reviewScheduled = submission.status === 'Review Scheduled';
  const completed = submission.status === 'Completed';
  const clientInput = hasClientInput(submission, assets);

  const assessment = step(
    'assessment',
    'Assessment Complete',
    'complete',
    'Your Consider the Possibilities™ answers are saved.',
  );

  const aiEvaluation = step(
    'ai-evaluation',
    'AI Evaluation Complete',
    intakeDone ? 'complete' : workspaceActive || reportDone ? 'active' : 'pending',
    intakeDone
      ? 'Intake analysis synthesized your discovery into priorities.'
      : 'AI evaluation is running on your submission.',
  );

  const digitalAudit = step(
    'digital-audit',
    'Digital Audit Complete',
    digitalDone
      ? 'complete'
      : submission.clientTypeClassification?.digitalAudit
        ? 'active'
        : 'pending',
    digitalDone
      ? (() => {
          const audit = submission.digitalPresenceAudit!;
          const parts = [`Digital Presence Score ${audit.overallScore}/100`];
          if (typeof audit.scores?.socialPresence === 'number') {
            parts.push(`Social ${audit.scores.socialPresence}`);
          }
          if (typeof audit.scores?.googleBusinessProfile === 'number') {
            parts.push(`GBP ${audit.scores.googleBusinessProfile}`);
          }
          return `${parts.join(' · ')}.`;
        })()
      : submission.clientTypeClassification?.digitalAudit
        ? 'Evaluating your public digital presence.'
        : 'Digital audit not required for this track.',
  );

  const executiveReport = step(
    'executive-report',
    'Executive Report Generated',
    reportDone ? 'complete' : 'pending',
    reportDone
      ? submission.executiveSnapshot
        ? `Executive Snapshot ready — maturity ${submission.executiveSnapshot.operationalMaturity}/100.`
        : 'Your project overview and proposal blueprint are ready.'
      : 'Executive brief will appear after analysis completes.',
  );

  let clientInputState: CtpTimelineStepState = 'pending';
  let clientInputDetail = 'Share brand assets and preferences in Design Studio when ready.';
  if (clientInput) {
    clientInputState = 'complete';
    clientInputDetail = 'Thanks — we have client input / assets to work with.';
  } else if (reportDone && workspaceActive) {
    clientInputState = 'active';
    clientInputDetail = 'Waiting for your Design Studio inputs (logo, colors, brand voice, inspiration).';
  }

  let buildingState: CtpTimelineStepState = 'pending';
  let buildingDetail = 'AI production begins after your inputs and executive direction.';
  if (workspaceFailed) {
    buildingState = 'failed';
    buildingDetail = 'Workspace setup needs attention — our team has been notified.';
  } else if (productionReady || siteLive || studioReady) {
    buildingState = 'complete';
    const artifactCount = submission.productionPackage?.artifacts.length ?? 0;
    buildingDetail = productionReady
      ? `AI production package ready (${artifactCount} artifact${artifactCount === 1 ? '' : 's'}).`
      : siteLive
        ? 'Starter solution is live on your site.'
        : 'Studio concepts are ready for review.';
  } else if (studioInProgress || (workspaceActive && clientInput)) {
    buildingState = 'active';
    buildingDetail = 'AI is assembling your solution from discovery + studio inputs.';
  } else if (workspaceActive) {
    buildingState = 'active';
    buildingDetail = 'Workspace is open — solution build can proceed as inputs arrive.';
  }

  let reviewState: CtpTimelineStepState = 'pending';
  let reviewDetail = 'EA executive review happens before final reveal.';
  if (completed) {
    reviewState = 'complete';
    reviewDetail = 'Executive review complete.';
  } else if (reviewScheduled || submission.status === 'Ready For Review' || studioReady) {
    reviewState = 'active';
    reviewDetail = reviewScheduled && submission.reviewScheduledAt
      ? `Review scheduled for ${new Date(submission.reviewScheduledAt).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}.`
      : 'Ready for executive review.';
  }

  let revealState: CtpTimelineStepState = 'pending';
  let revealDetail = 'Reveal unlocks after executive approval.';
  if (completed) {
    revealState = 'complete';
    revealDetail = 'Reveal is unlocked — celebrate the transformation.';
  } else if (reviewState === 'active') {
    revealState = 'pending';
    revealDetail = 'Next: approval unlocks your reveal experience.';
  }

  return [
    assessment,
    aiEvaluation,
    digitalAudit,
    executiveReport,
    step('client-input', 'Waiting For Client Input', clientInputState, clientInputDetail),
    step('ai-building', 'AI Building Solution', buildingState, buildingDetail),
    step('executive-review', 'Executive Review', reviewState, reviewDetail),
    step('reveal', 'Ready For Reveal', revealState, revealDetail),
  ];
}

function buildDesignStudio(submission: CtpSubmission, assets: CtpAdminAssetView[]): CtpDesignStudioItem[] {
  const byType = new Set(assets.map((asset) => asset.assetType));
  const answers = submission.discoveryAnswers ?? {};

  const item = (
    id: string,
    label: string,
    ready: boolean,
    readyDetail: string,
    neededDetail: string,
  ): CtpDesignStudioItem => ({
    id,
    label,
    status: ready ? 'ready' : 'needed',
    detail: ready ? readyDetail : neededDetail,
  });

  return [
    item('logo', 'Logo', byType.has('logo'), 'Logo on file.', 'Upload your logo when ready.'),
    item(
      'colors',
      'Brand colors',
      Boolean(answers.brand_colors) || byType.has('brand-guidelines'),
      'Color direction captured.',
      'Share primary / secondary colors.',
    ),
    item(
      'fonts',
      'Fonts',
      Boolean(answers.brand_fonts),
      'Font preferences noted.',
      'Optional — share preferred typefaces.',
    ),
    item(
      'photography',
      'Photography',
      byType.has('photos'),
      'Photo assets received.',
      'Upload brand or venue photography.',
    ),
    item(
      'brand-voice',
      'Brand voice',
      Boolean(answers.brand_voice) || Boolean(answers.success_definition),
      'Voice / tone signals captured from discovery.',
      'Describe how you want to sound.',
    ),
    item(
      'competitors',
      'Competitors / inspiration',
      Boolean(answers.competitors) || Boolean(answers.inspiration) || Boolean(answers.current_url),
      'Reference links captured.',
      'Share competitor or inspiration URLs.',
    ),
    item(
      'documents',
      'Documents / policies',
      byType.has('documents') || byType.has('policies'),
      'Documents on file.',
      'Upload policies or supporting docs if needed.',
    ),
    item(
      'services',
      'Products / services',
      Boolean(answers.desired_experiences) || Boolean(answers.offer_summary),
      'Offer direction captured in discovery.',
      'Clarify products and services for the build.',
    ),
  ];
}

export function buildCtpPortalStatusView(submission: CtpSubmission): CtpPortalStatusView {
  const assets = buildCtpAdminAssetViews(submission.assetManifest);
  const timeline = buildTimeline(submission, assets);
  const completeCount = timeline.filter((step) => step.state === 'complete').length;
  const percentComplete = Math.round((completeCount / timeline.length) * 100);

  const production = submission.productionPackage;

  return {
    id: submission.id,
    businessName: submission.businessName,
    status: submission.status,
    workspaceStatus: submission.workspaceStatus,
    studioStatus: submission.studioStatus,
    guideStage: submission.guideStage,
    reviewScheduledAt: submission.reviewScheduledAt,
    proposalId: submission.proposalId,
    submittedAt: submission.submittedAt,
    intakeSummary: submission.intakeAnalysis?.summary,
    clientTypeLabel: submission.clientType
      ? ctpClientTypeLabel(submission.clientType)
      : undefined,
    siteUrl: submission.siteUrl,
    digitalScore: submission.digitalPresenceAudit?.overallScore,
    socialScore: submission.digitalPresenceAudit?.scores?.socialPresence,
    gbpScore: submission.digitalPresenceAudit?.scores?.googleBusinessProfile,
    maturityScore: submission.executiveSnapshot?.operationalMaturity,
    adminWastePercent: submission.executiveSnapshot?.adminWastePercent,
    snapshotSummary: submission.executiveSnapshot?.summary,
    percentComplete,
    productionHeadline: production?.headline,
    productionStack: production?.stack,
    productionArtifacts: production?.artifacts.map((artifact) => ({
      id: artifact.id,
      title: artifact.title,
      summary: artifact.summary,
      bullets: artifact.bullets,
    })),
    assets,
    timeline,
    designStudio: buildDesignStudio(submission, assets),
    designStudioFields: {
      brand_colors:
        typeof submission.discoveryAnswers?.brand_colors === 'string'
          ? submission.discoveryAnswers.brand_colors
          : undefined,
      brand_fonts:
        typeof submission.discoveryAnswers?.brand_fonts === 'string'
          ? submission.discoveryAnswers.brand_fonts
          : undefined,
      brand_voice:
        typeof submission.discoveryAnswers?.brand_voice === 'string'
          ? submission.discoveryAnswers.brand_voice
          : undefined,
      competitors:
        typeof submission.discoveryAnswers?.competitors === 'string'
          ? submission.discoveryAnswers.competitors
          : undefined,
      inspiration:
        typeof submission.discoveryAnswers?.inspiration === 'string'
          ? submission.discoveryAnswers.inspiration
          : undefined,
      offer_summary:
        typeof submission.discoveryAnswers?.offer_summary === 'string'
          ? submission.discoveryAnswers.offer_summary
          : undefined,
    },
  };
}
