import type { ConnectionClassification, ConnectProfile, NewConnectionInput } from './connect-types';

function blob(input: NewConnectionInput) {
  return [
    input.company,
    input.role,
    input.location,
    input.notes,
    input.campaign,
    input.referralSource,
    input.utmCampaign,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function contains(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export async function classifyConnection(
  connection: NewConnectionInput,
  profile: ConnectProfile,
): Promise<ConnectionClassification> {
  const text = blob(connection);
  const hasAiKey = Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);

  const industry = contains(text, ['school', 'academy', 'student', 'education'])
    ? 'Education'
    : contains(text, ['sport', 'coach', 'athlete', 'team', 'club'])
      ? 'Sports'
      : contains(text, ['church', 'ministry', 'nonprofit', 'community'])
        ? 'Community'
        : contains(text, ['agency', 'consulting', 'business', 'founder', 'owner'])
          ? 'Business Services'
          : 'General';

  const connectionType = contains(text, ['partner', 'sponsor', 'collaboration'])
    ? 'Partner'
    : contains(text, ['client', 'customer', 'buy', 'pricing', 'proposal'])
      ? 'Prospect'
      : contains(text, ['speaker', 'event', 'podcast', 'media'])
        ? 'Media/Event'
        : 'General Contact';

  const opportunityType = contains(text, ['urgent', 'deadline', 'rfp', 'proposal'])
    ? 'Time-sensitive opportunity'
    : contains(text, ['sponsor', 'partner', 'collaboration'])
      ? 'Partnership'
      : contains(text, ['help', 'system', 'automation', 'portal'])
        ? 'Service opportunity'
        : 'Relationship';

  const highIntent = contains(text, ['urgent', 'pricing', 'proposal', 'ready', 'deadline', 'book', 'buy']);
  const mediumIntent = contains(text, ['interested', 'learn', 'follow up', 'connect', 'meeting']);
  const priority = highIntent ? 'High' : mediumIntent ? 'Normal' : 'Low';
  const firstResource = profile.resources[0];

  return {
    industry,
    connectionType,
    opportunityType,
    priority,
    recommendedFollowUp:
      priority === 'High'
        ? 'Follow up personally within 24 hours with a clear next step.'
        : priority === 'Normal'
          ? 'Send a helpful resource and schedule a light follow-up.'
          : 'Add to relationship nurture and watch for future signals.',
    recommendedDestination: profile.destinations.find((rule) => rule.priority === priority)?.url,
    suggestedResource: firstResource?.url,
    watchListMatch: [industry, connectionType].filter((part) => part !== 'General' && part !== 'General Contact').join(' / ') || 'No exact watch list match',
    relationshipScore: priority === 'High' ? 86 : priority === 'Normal' ? 68 : 42,
    ...(hasAiKey ? {} : {}),
  };
}
