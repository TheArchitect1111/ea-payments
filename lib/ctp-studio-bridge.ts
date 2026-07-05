import { createCampaign } from '@/lib/creative-studio/campaign-store';
import type { CampaignGoalId } from '@/lib/creative-studio/types';
import {
  getCtpSubmissionById,
  updateCtpSubmission,
  type CtpSubmission,
} from '@/lib/ctp-submissions';
import { syntheticOrgId, EA_INTERNAL_ORG_ID } from '@/lib/platform-store';
import { emitPulseEvent } from '@/lib/pulse-bus';

const EXPERIENCE_GOAL_MAP: Array<{ pattern: RegExp; goalId: CampaignGoalId }> = [
  { pattern: /event|camp|tournament|game/i, goalId: 'promote-event' },
  { pattern: /athlete|recruit|sports|team/i, goalId: 'recruit-athletes' },
  { pattern: /enroll|student|school|academy/i, goalId: 'enroll-students' },
  { pattern: /donat|fundraise|give|capital/i, goalId: 'raise-donations' },
  { pattern: /sponsor|partner|corporate/i, goalId: 'find-sponsors' },
  { pattern: /announce|launch|new program|opening/i, goalId: 'launch-new' },
  { pattern: /celebrat|success|milestone|award/i, goalId: 'celebrate-success' },
  { pattern: /portal|website|landing|magnifi|amplifi|connect/i, goalId: 'launch-new' },
];

function mapGoalId(submission: CtpSubmission): CampaignGoalId {
  const haystack = [
    ...(submission.desiredExperiences ?? []),
    JSON.stringify(submission.recommendations ?? ''),
    JSON.stringify(submission.discoveryAnswers ?? ''),
    submission.intakeAnalysis?.summary ?? '',
  ].join(' ');

  for (const { pattern, goalId } of EXPERIENCE_GOAL_MAP) {
    if (pattern.test(haystack)) return goalId;
  }
  return 'custom';
}

function buildCampaignStory(submission: CtpSubmission): string {
  const parts = [
    `Consider The Possibilities campaign for ${submission.businessName}.`,
    `Primary contact: ${submission.contactName} (${submission.email}).`,
  ];

  if (submission.intakeAnalysis?.summary) {
    parts.push(`Executive summary: ${submission.intakeAnalysis.summary}`);
  }

  if (submission.desiredExperiences?.length) {
    parts.push(`Desired experiences: ${submission.desiredExperiences.join(', ')}.`);
  }

  if (submission.recommendations) {
    parts.push(`Discovery recommendations: ${JSON.stringify(submission.recommendations).slice(0, 1200)}.`);
  }

  if (submission.discoveryAnswers && Object.keys(submission.discoveryAnswers).length) {
    const highlights = Object.entries(submission.discoveryAnswers)
      .slice(0, 10)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(' | ');
    parts.push(`Discovery highlights: ${highlights.slice(0, 1800)}.`);
  }

  parts.push(
    'Design direction: warm, premium, trustworthy — aligned with the first collaborative review and blueprint.',
  );

  return parts.join('\n\n');
}

function studioOrganizationId(submission: CtpSubmission): string {
  return resolveCtpOrganizationId({
    portalSlug: submission.portalSlug,
    considerSlug: submission.considerSlug,
  });
}

export function resolveCtpOrganizationId(input: {
  portalSlug?: string;
  considerSlug?: string;
}): string {
  if (input.portalSlug) return syntheticOrgId(input.portalSlug);
  if (input.considerSlug) return syntheticOrgId(input.considerSlug);
  return EA_INTERNAL_ORG_ID;
}

export async function runCtpStudioCampaign(
  submissionId: string,
): Promise<{ ok: boolean; error?: string; campaignId?: string }> {
  const submission = await getCtpSubmissionById(submissionId);
  if (!submission) {
    return { ok: false, error: 'CTP submission not found.' };
  }

  if (submission.creativeCampaignId) {
    return { ok: true, campaignId: submission.creativeCampaignId };
  }

  if (submission.studioStatus === 'Ready For Review' || submission.studioStatus === 'Completed') {
    return { ok: false, error: 'Studio lifecycle already advanced past campaign creation.' };
  }

  if (submission.workspaceStatus === 'Pending' || submission.workspaceStatus === 'Provisioning') {
    return { ok: false, error: 'Workspace must be active before studio campaign creation.' };
  }

  if (submission.workspaceStatus === 'Failed') {
    return { ok: false, error: 'Resolve workspace provisioning before starting studio work.' };
  }

  try {
    const goalId = mapGoalId(submission);
    const story = buildCampaignStory(submission);
    const campaign = await createCampaign({
      goalId,
      story,
      organizationId: studioOrganizationId(submission),
    });

    await updateCtpSubmission(submissionId, {
      creativeCampaignId: campaign.id,
      studioStatus: 'In Progress',
      status: 'Studio In Progress',
    });

    await emitPulseEvent({
      product: 'ea-platform',
      type: 'ctp.studio.started',
      title: `CTP studio started — ${submission.businessName}`,
      detail: `${campaign.brief.title} · ${campaign.goalLabel}`,
      priority: 'medium',
      href: `/admin/creative-studio/campaigns/${campaign.id}`,
      tenantId: submission.considerSlug,
      objectId: submission.id,
      metadata: {
        ctpSubmissionId: submission.id,
        creativeCampaignId: campaign.id,
        goalId: campaign.goalId,
      },
    });

    return { ok: true, campaignId: campaign.id };
  } catch (err) {
    console.error('[ctp-studio-bridge] campaign creation failed:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Studio campaign creation failed.',
    };
  }
}

/** Fire-and-forget — never throws. */
export function scheduleCtpStudioCampaign(submissionId: string): void {
  void runCtpStudioCampaign(submissionId).catch((err) => {
    console.error('[ctp-studio-bridge] scheduled run failed:', err);
  });
}
