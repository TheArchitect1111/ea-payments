/**
 * CTP → Open Design entry point. Called from ctp-studio-bridge after campaign creation.
 */

import type { CtpSubmission } from '@/lib/ctp-submissions';
import { buildDualBriefFromCtp } from './brief-generator';
import { emitOpenDesignPhase } from './pipeline';
import type { CampaignGoalId } from '@/lib/creative-studio/types';
import type { CreativeExperienceBrief } from './types';

export async function beginOpenDesignFromCtp(input: {
  submission: CtpSubmission;
  organizationId: string;
  story: string;
  goalId: CampaignGoalId;
}): Promise<{ openDesignBrief: CreativeExperienceBrief }> {
  const { openDesignBrief } = await buildDualBriefFromCtp(
    input.submission,
    input.organizationId,
    input.story,
    input.goalId,
  );

  if (openDesignBrief.blockers.length === 0) {
    await emitOpenDesignPhase(
      openDesignBrief,
      `Creative pipeline started for ${input.submission.businessName}.`,
      input.submission.portalSlug,
    );
  } else {
    await emitPulseStoryBlocked(openDesignBrief, input.submission.portalSlug);
  }

  return { openDesignBrief };
}

async function emitPulseStoryBlocked(
  brief: CreativeExperienceBrief,
  tenantId?: string,
): Promise<void> {
  const { emitPulseEvent } = await import('@/lib/pulse-bus');
  await emitPulseEvent({
    type: 'open.design.story.blocked',
    product: 'ea-platform',
    title: 'Open Design — story required',
    detail: brief.blockers[0] ?? 'Story sentence missing.',
    priority: 'high',
    tenantId: tenantId ?? brief.organizationId,
    objectId: brief.id,
    href: '/admin/ctp',
    metadata: { openDesignPhase: 'story-extraction' },
  });
}
