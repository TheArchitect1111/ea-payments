export type EAGuideContextId =
  | 'portal'
  | 'simplifi'
  | 'magnifi'
  | 'pulse'
  | 'learning'
  | 'cpr'
  | 'family'
  | 'admin'
  | 'update-hub';

export type EAGuideOrbState =
  | 'idle'
  | 'watching'
  | 'thinking'
  | 'alert'
  | 'listening'
  | 'speaking'
  | 'success'
  | 'warning'
  | 'celebration';

export type EAGuideActionKind = 'href' | 'event' | 'memory';

export interface EAGuideAction {
  id: string;
  label: string;
  kind: EAGuideActionKind;
  href?: string;
  eventName?: string;
}

export interface EAGuideContext {
  id: EAGuideContextId;
  product: string;
  role: string;
  focus: string[];
  greeting: string;
  sinceLastVisit: string[];
  recommendedAction: string;
  recommendationDetail: string;
  actions: EAGuideAction[];
  state: EAGuideOrbState;
  protocolAwareness: string[];
}

export interface EAGuideMemoryItem {
  id: string;
  label: string;
  detail: string;
  createdAt: string;
  contextId: EAGuideContextId;
}

export const EA_GUIDE_MEMORY_KEY = 'ea-guide-memory-v1';
export const EA_GUIDE_DAILY_BRIEF_KEY = 'ea-guide-daily-brief-v1';

export const EA_GUIDE_PROTOCOLS = [
  'EA Master Protocol',
  'EA Skin Protocol',
  'EA Website Protocol',
  'EA Chassis Protocol',
  'EA Training Protocol',
  'Industry Playbooks',
  'Organization Rules',
  'Portal-Specific Standards',
];

export function resolveGuideContext(pathname: string): EAGuideContext {
  if (pathname.includes('/simplifi')) return simplifiContext();
  if (pathname.includes('/consider') || pathname.includes('/magnifi')) return magnifiContext();
  if (pathname.includes('/pulse')) return pulseContext(pathname);
  if (pathname.includes('/learning') || pathname.includes('/academy')) return learningContext();
  if (pathname.includes('/updates')) return updateHubContext(pathname);
  if (pathname.includes('/cpr') || pathname.includes('athlete')) return cprContext();
  if (pathname.includes('/admin')) return adminContext();
  if (pathname.includes('/portal')) return portalContext(pathname);
  return portalContext(pathname);
}

function portalContext(pathname: string): EAGuideContext {
  const slug = portalSlug(pathname);
  return {
    id: 'portal',
    product: 'EA Chassis',
    role: 'Strategic Assistant',
    focus: ['Daily Brief', 'Portal activity', 'Follow-ups', 'Next steps'],
    greeting: 'Good afternoon.',
    sinceLastVisit: ['Your portal workspace is ready for review.', 'Pulse, Simplifi, and Amplifi are connected.', 'One recommended action is available.'],
    recommendedAction: 'Review the current Action Center.',
    recommendationDetail: 'Start with the highest-priority item before opening dashboards or modules.',
    actions: [
      { id: 'dashboard', label: 'Open Dashboard', kind: 'href', href: slug ? `/portal/${slug}` : '/portal/login' },
      { id: 'simplifi', label: 'Open Simplifi', kind: 'href', href: slug ? `/portal/${slug}/simplifi` : '/simplifi/workspace' },
      { id: 'later', label: 'Remind Me Later', kind: 'memory' },
    ],
    state: 'alert',
    protocolAwareness: EA_GUIDE_PROTOCOLS,
  };
}

function simplifiContext(): EAGuideContext {
  return {
    id: 'simplifi',
    product: 'Simplifi',
    role: 'Opportunity Coach',
    focus: ['Opportunities', 'Watch Lists', 'Follow-Ups', 'Reminders', 'Prioritization'],
    greeting: 'I am watching for opportunities worth acting on.',
    sinceLastVisit: ['New captures should be reviewed for next steps.', 'Follow-ups create value faster than saved notes.', 'Magnifi can turn promising captures into a shareable story.'],
    recommendedAction: 'Capture or review the strongest opportunity.',
    recommendationDetail: 'Move from capture to understand, prioritize, act, and create value.',
    actions: [
      { id: 'capture', label: 'Capture', kind: 'href', href: '/simplifi/capture' },
      { id: 'workspace', label: 'Open Workspace', kind: 'href', href: '/simplifi/workspace' },
      { id: 'follow-up', label: 'Create Follow-Up', kind: 'memory' },
      { id: 'magnifi', label: 'Send to Magnifi', kind: 'href', href: '/consider/selena' },
    ],
    state: 'watching',
    protocolAwareness: ['EA Master Protocol', 'EA Chassis Protocol', 'EA Assessment Protocol', 'EA Sales Protocol'],
  };
}

function magnifiContext(): EAGuideContext {
  return {
    id: 'magnifi',
    product: 'Magnifi',
    role: 'Business Analyst',
    focus: ['Assessments', 'Opportunity Discovery', 'Growth Opportunities', 'Recommendations', 'Future Possibilities'],
    greeting: 'I noticed this story can become a clearer decision path.',
    sinceLastVisit: ['The opportunity narrative is ready to review.', 'Assessment and next-step signals should stay visible.', 'The strongest stories connect proof with possibility.'],
    recommendedAction: 'Review the recommendation path.',
    recommendationDetail: 'Look for the clearest transformation, then decide whether to assess, share, or follow up.',
    actions: [
      { id: 'assessment', label: 'Take Assessment', kind: 'href', href: '/assessment' },
      { id: 'capture', label: 'Create Capture', kind: 'href', href: '/simplifi/capture' },
      { id: 'memory', label: 'Remember This', kind: 'memory' },
    ],
    state: 'thinking',
    protocolAwareness: ['EA Master Protocol', 'EA Website Protocol', 'EA Image Protocol', 'EA Sales Protocol'],
  };
}

function pulseContext(pathname: string): EAGuideContext {
  const slug = portalSlug(pathname);
  return {
    id: 'pulse',
    product: 'Pulse',
    role: 'Strategic Advisor',
    focus: ['Visibility', 'Capacity', 'Engagement', 'Training', 'Organizational Health'],
    greeting: 'Your attention is needed on the signals that changed.',
    sinceLastVisit: ['Operational health is ready for review.', 'Training and engagement should be checked together.', 'One dashboard review can clarify the next action.'],
    recommendedAction: 'Review Pulse scores before moving into module work.',
    recommendationDetail: 'Pulse should explain what changed, why it matters, and what to do next.',
    actions: [
      { id: 'review', label: 'Review', kind: 'href', href: slug ? `/portal/${slug}/pulse` : '/portal/login' },
      { id: 'report', label: 'Generate Report', kind: 'memory' },
      { id: 'investigate', label: 'Investigate', kind: 'memory' },
    ],
    state: 'warning',
    protocolAwareness: ['EA Master Protocol', 'EA Chassis Protocol', 'EA Training Protocol', 'Organization Rules'],
  };
}

function learningContext(): EAGuideContext {
  return {
    id: 'learning',
    product: 'Learning Hub',
    role: 'Training Coach',
    focus: ['Progress', 'Certifications', 'Learning Paths', 'Knowledge Retention'],
    greeting: 'I noticed training progress is part of today\'s value path.',
    sinceLastVisit: ['Learning progress should be checked before certification work.', 'Incomplete modules are the fastest path to regain momentum.', 'Team reminders help reduce stalled adoption.'],
    recommendedAction: 'Continue the next unfinished lesson.',
    recommendationDetail: 'Completion creates confidence, retention, and better system adoption.',
    actions: [
      { id: 'continue', label: 'Continue', kind: 'href', href: '/admin/academy' },
      { id: 'reminder', label: 'Send Reminder', kind: 'memory' },
      { id: 'progress', label: 'View Progress', kind: 'href', href: '/admin/academy' },
    ],
    state: 'alert',
    protocolAwareness: ['EA Training Protocol', 'EA Chassis Protocol', 'Organization Rules'],
  };
}

function cprContext(): EAGuideContext {
  return {
    id: 'cpr',
    product: 'CPR',
    role: 'Recruiting Advisor',
    focus: ['Recruiting', 'Film', 'Profiles', 'Exposure', 'Next Steps'],
    greeting: 'I am watching the details that affect recruiting momentum.',
    sinceLastVisit: ['Profile completeness affects exposure.', 'Film and deadlines should stay visible.', 'Family communication should point to the next milestone.'],
    recommendedAction: 'Review the next recruiting milestone.',
    recommendationDetail: 'The strongest path is profile, proof, outreach, and follow-up.',
    actions: [
      { id: 'profile', label: 'Review Profile', kind: 'memory' },
      { id: 'film', label: 'Check Film', kind: 'memory' },
      { id: 'message', label: 'Send Message', kind: 'memory' },
    ],
    state: 'watching',
    protocolAwareness: ['EA Master Protocol', 'EA Chassis Protocol', 'Industry Playbooks', 'Portal-Specific Standards'],
  };
}

function updateHubContext(pathname: string): EAGuideContext {
  const slug = portalSlug(pathname);
  return {
    id: 'update-hub',
    product: 'Update Hub',
    role: 'Concierge',
    focus: ['Messages', 'Updates', 'Tasks', 'Approvals', 'Communication'],
    greeting: 'I noticed stakeholder communication may need a clear update.',
    sinceLastVisit: ['Updates reduce confusion when they are timely.', 'Pending requests should be resolved before new work starts.', 'Clear status language improves trust.'],
    recommendedAction: 'Create or review the next update.',
    recommendationDetail: 'Keep the message short, specific, and tied to visible progress.',
    actions: [
      { id: 'create', label: 'Create Update', kind: 'href', href: slug ? `/portal/${slug}/updates/new` : '/portal/login' },
      { id: 'review', label: 'Review Updates', kind: 'href', href: slug ? `/portal/${slug}/updates` : '/portal/login' },
      { id: 'later', label: 'Remind Me Later', kind: 'memory' },
    ],
    state: 'alert',
    protocolAwareness: ['EA Brand Protocol', 'EA Chassis Protocol', 'Portal-Specific Standards'],
  };
}

function adminContext(): EAGuideContext {
  return {
    id: 'admin',
    product: 'Pulse',
    role: 'Strategic Advisor',
    focus: ['Visibility', 'Capacity', 'Revenue', 'Delivery', 'Organizational Health'],
    greeting: 'I am watching the operating signals across Mission Control.',
    sinceLastVisit: ['Pipeline, delivery, and approvals should stay connected.', 'EA Factory protocols are available for build direction.', 'One administrative review can prevent downstream drift.'],
    recommendedAction: 'Review the highest-leverage operating area.',
    recommendationDetail: 'Start with the section most likely to unblock revenue, delivery, or client success.',
    actions: [
      { id: 'master', label: 'Open Dashboard', kind: 'href', href: '/admin/master' },
      { id: 'protocols', label: 'Review Protocols', kind: 'href', href: '/admin/protocol-center' },
      { id: 'factory', label: 'Open EA Factory', kind: 'href', href: '/admin/ea-factory' },
    ],
    state: 'watching',
    protocolAwareness: EA_GUIDE_PROTOCOLS,
  };
}

function portalSlug(pathname: string) {
  const match = pathname.match(/\/portal\/([^/]+)/);
  return match?.[1] && !['login', 'register', 'forgot-password', 'reset-password'].includes(match[1])
    ? match[1]
    : '';
}
