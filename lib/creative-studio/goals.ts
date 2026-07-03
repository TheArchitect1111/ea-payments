import type { CampaignGoalId } from './types';

export interface CampaignGoalCard {
  id: CampaignGoalId;
  emoji: string;
  label: string;
  description: string;
}

export const CAMPAIGN_GOALS: CampaignGoalCard[] = [
  { id: 'promote-event', emoji: '📢', label: 'Promote an Event', description: 'Fill seats, boost attendance, and keep everyone informed.' },
  { id: 'recruit-athletes', emoji: '🏀', label: 'Recruit Athletes', description: 'Reach families and athletes with a clear next step.' },
  { id: 'enroll-students', emoji: '🎓', label: 'Enroll Students', description: 'Open applications and drive qualified enrollment.' },
  { id: 'fill-camp', emoji: '🏕', label: 'Fill a Camp', description: 'Drive registrations before capacity fills up.' },
  { id: 'raise-donations', emoji: '💰', label: 'Raise Donations', description: 'Inspire giving with a coordinated appeal.' },
  { id: 'find-sponsors', emoji: '🤝', label: 'Find Sponsors', description: 'Package your story for partner conversations.' },
  { id: 'celebrate-success', emoji: '🎉', label: 'Celebrate Success', description: 'Share wins and build momentum across channels.' },
  { id: 'announcement', emoji: '📣', label: 'Make an Announcement', description: 'One message, every channel, same day.' },
  { id: 'launch-new', emoji: '🌐', label: 'Launch Something New', description: 'Introduce a program, product, or initiative.' },
  { id: 'custom', emoji: '✨', label: 'Custom Campaign', description: 'Start with your goal — EA adapts the package.' },
];

export function goalById(id: CampaignGoalId): CampaignGoalCard {
  return CAMPAIGN_GOALS.find((g) => g.id === id) ?? CAMPAIGN_GOALS[CAMPAIGN_GOALS.length - 1];
}
