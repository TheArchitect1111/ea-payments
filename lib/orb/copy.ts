import type { ActionCenterPayload } from '@/lib/action-center';
import type { OrbBriefSlice, OrbFinding, OrbRecommendation } from './types';

export function buildOrbCopy(input: {
  pathname: string;
  brief: OrbBriefSlice;
  findings: OrbFinding[];
  recommendation: OrbRecommendation | null;
  actionCenter: ActionCenterPayload;
  objectCount: number;
  entityId?: string | null;
}): { title: string; summary: string; ariaLabel: string } {
  const path = input.pathname;
  const greeting = input.brief.greeting.replace(/\.$/, '');
  const attention = input.actionCenter.needsAttention.length;
  const recommended = input.actionCenter.recommended.length;

  if (input.findings.length === 0 && !input.recommendation) {
    const summary = path.includes('/capture')
      ? 'I’m ready when you need me. Capture something and I will organize the next move.'
      : 'Nothing urgent is waiting. Your day is clear.';
    return {
      title: greeting,
      summary,
      ariaLabel: 'SIMPLIFI Orb, nothing urgent',
    };
  }

  let routeLine = '';
  if (path.includes('/opportunity/')) {
    routeLine = input.entityId
      ? 'You’re viewing an opportunity profile — here’s what still matters around it.'
      : 'You’re viewing an opportunity.';
  } else if (path.includes('/capture')) {
    routeLine = 'While you capture, I’ll watch for people, companies, and follow-ups.';
  } else if (path.includes('/calendar')) {
    routeLine =
      attention > 0
        ? `You have ${attention} time-sensitive item${attention === 1 ? '' : 's'} tied to commitments.`
        : 'No dated commitments need attention right now.';
  } else if (path.includes('/follow-ups')) {
    routeLine =
      attention > 0
        ? `${attention} follow-up signal${attention === 1 ? '' : 's'} need review.`
        : 'Follow-ups look quiet.';
  } else if (path.includes('/inbox')) {
    routeLine =
      input.objectCount > 0
        ? `${input.objectCount} active opportunit${input.objectCount === 1 ? 'y' : 'ies'} in your inbox.`
        : 'Inbox is clear.';
  } else if (path.includes('/ask')) {
    routeLine = 'Ask from your workspace — I’ll stay grounded in what you’ve captured.';
  } else if (path.includes('/settings')) {
    routeLine = 'Settings are open. I’m still watching your Brief in the background.';
  } else {
    routeLine =
      attention > 0
        ? `${attention} thing${attention === 1 ? '' : 's'} deserve${attention === 1 ? 's' : ''} your attention.`
        : recommended > 0
          ? 'I have a useful next step when you’re ready.'
          : 'While you were focused elsewhere, I reviewed what changed.';
  }

  const stateHint =
    attention > 0
      ? `${attention} recommendation${attention === 1 ? '' : 's'} available`
      : 'ready';

  return {
    title: greeting,
    summary: routeLine,
    ariaLabel: `SIMPLIFI Orb, ${stateHint}`,
  };
}
