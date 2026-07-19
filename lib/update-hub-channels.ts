/** Update Hub audience channels — communication backbone for the Portal OS. */
export const UPDATE_HUB_CHANNELS = [
  'members',
  'staff',
  'volunteers',
  'stakeholders',
  'organization',
] as const;

export type UpdateHubChannel = (typeof UPDATE_HUB_CHANNELS)[number];

export const UPDATE_HUB_CHANNEL_LABELS: Record<UpdateHubChannel, string> = {
  members: 'Members',
  staff: 'Staff',
  volunteers: 'Volunteers',
  stakeholders: 'Stakeholders',
  organization: 'Organization-wide',
};

export function normalizeUpdateHubChannel(raw?: string): UpdateHubChannel | undefined {
  const key = (raw ?? '').trim().toLowerCase();
  return UPDATE_HUB_CHANNELS.find((c) => c === key);
}

export function channelFromRequestType(requestType: string): UpdateHubChannel {
  const t = requestType.toLowerCase();
  if (t.includes('staff') || t.includes('internal')) return 'staff';
  if (t.includes('volunteer')) return 'volunteers';
  if (t.includes('member') || t.includes('parent')) return 'members';
  if (t.includes('stakeholder') || t.includes('board') || t.includes('sponsor')) {
    return 'stakeholders';
  }
  return 'organization';
}
