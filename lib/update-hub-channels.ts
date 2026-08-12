/** Update Hub audience channels — communication backbone for the Portal OS. */
export const UPDATE_HUB_CHANNELS = [
  'members',
  'clients',
  'students',
  'practitioners',
  'media-guests',
  'staff',
  'volunteers',
  'partners',
  'stakeholders',
  'organization',
] as const;

export type UpdateHubChannel = (typeof UPDATE_HUB_CHANNELS)[number];

export const UPDATE_HUB_CHANNEL_LABELS: Record<UpdateHubChannel, string> = {
  members: 'Members',
  clients: 'Clients',
  students: 'Students & trainees',
  practitioners: 'Certified practitioners',
  'media-guests': 'Media guests',
  staff: 'Staff',
  volunteers: 'Volunteers',
  partners: 'Partners & vendors',
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
  if (t.includes('client')) return 'clients';
  if (t.includes('student') || t.includes('training')) return 'students';
  if (t.includes('practitioner')) return 'practitioners';
  if (t.includes('media') || t.includes('lifeline')) return 'media-guests';
  if (t.includes('partner') || t.includes('vendor')) return 'partners';
  if (t.includes('member') || t.includes('parent')) return 'members';
  if (t.includes('stakeholder') || t.includes('board') || t.includes('sponsor')) {
    return 'stakeholders';
  }
  return 'organization';
}
