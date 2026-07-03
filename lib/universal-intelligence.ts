import type { EAGuideContext, EAGuideContextId } from '@/lib/ea-guide';

export type EASpecialistId =
  | 'research'
  | 'creative'
  | 'communications'
  | 'website'
  | 'analytics'
  | 'relationship'
  | 'operations'
  | 'knowledge';

export interface EASpecialist {
  id: EASpecialistId;
  name: string;
  role: string;
  signals: string[];
  outputs: string[];
}

export interface PossibilityRecommendation {
  id: string;
  title: string;
  detail: string;
  specialistId: EASpecialistId;
  actionLabel: string;
  href?: string;
}

export interface UniversalIntelligenceModel {
  orbieRole: string;
  activeSpecialists: EASpecialist[];
  memorySignals: string[];
  primary: PossibilityRecommendation;
  secondary: PossibilityRecommendation[];
  helpTopics: string[];
  smartchitectureChecks: string[];
}

export const EA_SPECIALISTS: EASpecialist[] = [
  {
    id: 'research',
    name: 'Research Specialist',
    role: 'Validates outside information before recommendations are made.',
    signals: ['industry changes', 'grant opportunities', 'competitors', 'rule changes'],
    outputs: ['executive summaries', 'key findings', 'sources', 'risks', 'recommended next actions'],
  },
  {
    id: 'creative',
    name: 'Creative Specialist',
    role: 'Prepares visual and campaign assets from the current objective.',
    signals: ['campaigns', 'events', 'brand assets', 'launch moments'],
    outputs: ['flyers', 'landing pages', 'graphics', 'campaign visuals'],
  },
  {
    id: 'communications',
    name: 'Communications Specialist',
    role: 'Coordinates audience timing, messaging, and follow-up sequences.',
    signals: ['announcements', 'parent communication', 'email', 'SMS', 'social posts'],
    outputs: ['campaign timing', 'message drafts', 'communication sequences'],
  },
  {
    id: 'website',
    name: 'Website Specialist',
    role: 'Watches public-facing pages for freshness, clarity, and conversion.',
    signals: ['homepage freshness', 'events', 'SEO opportunities', 'broken links'],
    outputs: ['content improvements', 'page recommendations', 'launch checks'],
  },
  {
    id: 'analytics',
    name: 'Analytics Specialist',
    role: 'Turns engagement and operating signals into simple recommendations.',
    signals: ['registrations', 'donations', 'campaign performance', 'engagement trends'],
    outputs: ['trend summaries', 'attention signals', 'performance recommendations'],
  },
  {
    id: 'relationship',
    name: 'Relationship Specialist',
    role: 'Identifies moments to strengthen sponsors, donors, families, and partners.',
    signals: ['sponsors', 'donors', 'parents', 'partners', 'alumni'],
    outputs: ['relationship prompts', 'recognition ideas', 'follow-up opportunities'],
  },
  {
    id: 'operations',
    name: 'Operations Specialist',
    role: 'Keeps tasks, deadlines, calendars, and priorities connected.',
    signals: ['deadlines', 'tasks', 'approvals', 'handoffs'],
    outputs: ['next steps', 'reminders', 'priority sequencing'],
  },
  {
    id: 'knowledge',
    name: 'Knowledge Specialist',
    role: 'Maintains shared organizational memory for better future recommendations.',
    signals: ['brand voice', 'successful campaigns', 'seasonal events', 'user preferences'],
    outputs: ['memory updates', 'reused knowledge', 'preference-aware guidance'],
  },
];

const SMARTCHITECTURE_CHECKS = [
  'Reduce work',
  'Reduce decisions',
  'Reuse existing knowledge',
  'Connect another module',
  'Identify another possibility',
  'Increase organizational capacity',
  'Expand what is possible',
];

const HELP_TOPICS = [
  'What should I do next?',
  'Walk me through this page',
  'Show me what changed',
  'Explain this recommendation',
  'Find help for this workflow',
];

const SPECIALIST_BY_ID = EA_SPECIALISTS.reduce<Record<EASpecialistId, EASpecialist>>(
  (acc, specialist) => {
    acc[specialist.id] = specialist;
    return acc;
  },
  {} as Record<EASpecialistId, EASpecialist>,
);

export function buildUniversalIntelligence(context: EAGuideContext): UniversalIntelligenceModel {
  const possibilities = buildPossibilityCenter(context);
  const activeSpecialistIds = inferActiveSpecialists(context.id);

  return {
    orbieRole: "Digital Chief of Staff",
    activeSpecialists: activeSpecialistIds.map((id) => SPECIALIST_BY_ID[id]),
    memorySignals: buildMemorySignals(context),
    primary: possibilities[0],
    secondary: possibilities.slice(1, 3),
    helpTopics: HELP_TOPICS,
    smartchitectureChecks: SMARTCHITECTURE_CHECKS,
  };
}

function inferActiveSpecialists(contextId: EAGuideContextId): EASpecialistId[] {
  if (contextId === 'cpr') return ['research', 'relationship', 'communications', 'knowledge'];
  if (contextId === 'discover') return ['research', 'operations', 'knowledge'];
  if (contextId === 'magnifi') return ['research', 'analytics', 'communications', 'knowledge'];
  if (contextId === 'pulse' || contextId === 'admin') return ['analytics', 'operations', 'relationship', 'knowledge'];
  if (contextId === 'learning') return ['operations', 'knowledge', 'communications'];
  if (contextId === 'update-hub') return ['communications', 'operations', 'knowledge'];
  return ['operations', 'communications', 'analytics', 'knowledge'];
}

function buildMemorySignals(context: EAGuideContext) {
  return [
    `${context.product} context`,
    ...context.focus.slice(0, 3),
    ...context.protocolAwareness.slice(0, 2),
  ].slice(0, 5);
}

function buildPossibilityCenter(context: EAGuideContext): PossibilityRecommendation[] {
  const defaultHref = context.actions.find((action) => action.kind === 'href')?.href;

  if (context.id === 'discover') {
    return [
      possibility('discover-primary', 'Continue the guided discovery', context.recommendationDetail, 'operations', 'Continue', defaultHref),
      possibility('discover-research', 'Research similar organizations', 'Compare the goal against patterns that have worked for similar teams.', 'research', 'Start research'),
      possibility('discover-memory', 'Save the emerging direction', 'Let the Knowledge Specialist reuse this context in the Blueprint.', 'knowledge', 'Remember this'),
    ];
  }

  if (context.id === 'cpr') {
    return [
      possibility('cpr-primary', 'Review the next recruiting milestone', context.recommendationDetail, 'research', 'Review milestone', defaultHref),
      possibility('cpr-relationship', 'Prepare family follow-up', 'Keep the athlete, parent, and coach aligned around the next outreach step.', 'relationship', 'Plan follow-up'),
      possibility('cpr-communications', 'Draft the next update', 'Turn recruiting status into a clear message for the family.', 'communications', 'Draft update'),
    ];
  }

  if (context.id === 'admin' || context.id === 'pulse') {
    return [
      possibility('ops-primary', context.recommendedAction, context.recommendationDetail, 'analytics', 'Review signal', defaultHref),
      possibility('ops-approval', 'Resolve the most important open approval', 'Approvals, delivery, and revenue should stay connected before more work starts.', 'operations', 'Review approval'),
      possibility('ops-relationship', 'Identify a relationship moment', 'Look for a client, partner, or sponsor who needs recognition or follow-up.', 'relationship', 'Find moment'),
    ];
  }

  return [
    possibility('default-primary', context.recommendedAction, context.recommendationDetail, 'operations', 'Start here', defaultHref),
    possibility('default-help', 'Ask Orbie to explain this workflow', 'Use context-aware help before opening another module.', 'knowledge', 'Ask Orbie'),
    possibility('default-communication', 'Prepare the next clear update', 'A short status update may reduce confusion and keep momentum moving.', 'communications', 'Prepare update'),
  ];
}

function possibility(
  id: string,
  title: string,
  detail: string,
  specialistId: EASpecialistId,
  actionLabel: string,
  href?: string,
): PossibilityRecommendation {
  return { id, title, detail, specialistId, actionLabel, href };
}
