export type EAGuideContextId =
  | 'discover'
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
  badgeLabel?: string;
  sinceLastVisit: string[];
  recommendedAction: string;
  recommendationDetail: string;
  recommendationWhy?: string[];
  dailyBrief?: string[];
  opportunityHealth?: string[];
  winWall?: string[];
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
export const EA_GUIDE_LAUNCH_SIGNAL_KEY = 'ea-guide-launch-signal-v1';
export const EA_GUIDE_FIRST_USE_KEY = 'ea-guide-first-use-complete-v1';

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
  if (pathname.includes('/discover') || pathname === '/assessment' || pathname.includes('/assessment/thank-you')) return discoverContext(pathname);
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

function discoverContext(pathname: string): EAGuideContext {
  const finished = pathname.includes('/thank-you');
  return {
    id: 'discover',
    product: 'Discover The Possibilities™',
    role: 'Possibility Guide',
    focus: ['Goals', 'Training solutions', 'Pages', 'Portals', 'Automation', 'Next steps'],
    greeting: finished ? 'I am reviewing what you shared.' : 'I am here while you discover what is possible.',
    badgeLabel: 'Guidance Available',
    sinceLastVisit: finished
      ? ['Your discovery responses were received.', 'A Blueprint path can begin from what you shared.', 'Training, portals, pages, and automation will be considered together.']
      : ['We are learning about your organization.', 'Your choices shape the path in real time.', 'Training solutions are part of this conversation.'],
    recommendedAction: finished ? 'Review the next-step possibilities.' : "Continue with Discover What's Possible.",
    recommendationDetail: finished
      ? 'The next step is to turn your responses into practical recommendations.'
      : 'Choose every option that feels useful. The prompts are designed to give you ideas.',
    recommendationWhy: finished
      ? ['You completed the guided discovery.', 'Your selections reveal which experiences may help first.', 'The Blueprint can now connect goals, training, systems, and communication.']
      : ['This page adapts as you answer.', 'Training, onboarding, resource libraries, and AI-guided support may be useful.', 'More context helps the Blueprint feel specific.'],
    dailyBrief: finished
      ? ['Discovery received', 'Blueprint direction forming', 'Next step ready for review']
      : ['Start with who you are', 'Choose what you want to make possible', 'Add training needs if knowledge, onboarding, or guidance matters'],
    opportunityHealth: ['Active: Discovery path', 'Watching: Goals and training signals', 'Next: Blueprint direction'],
    winWall: ['Discover The Possibilities™ started'],
    actions: [
      { id: 'walkthrough', label: 'Walk Me Through It', kind: 'event', eventName: 'ea-guide:discover-walkthrough' },
      { id: 'training', label: 'Explain Training Solutions', kind: 'event', eventName: 'ea-guide:discover-training' },
      { id: 'review', label: finished ? 'Review Next Step' : "Continue Discovery", kind: 'href', href: finished ? '/discover' : '#top' },
    ],
    state: finished ? 'success' : 'watching',
    protocolAwareness: ['EA Master Protocol', 'EA Training Protocol', 'EA Website Protocol', 'EA Chassis Protocol'],
  };
}

function portalContext(pathname: string): EAGuideContext {
  const slug = portalSlug(pathname);
  return {
    id: 'portal',
    product: 'EA Chassis',
    role: 'Strategic Assistant',
    focus: ['Daily Brief', 'Portal activity', 'Follow-ups', 'Next steps'],
    greeting: 'Good afternoon.',
    badgeLabel: 'Follow-Up Due',
    sinceLastVisit: ['Your portal workspace is ready for review.', 'Pulse, Simplifi, and Amplifi are connected.', 'One recommended action is available.'],
    recommendedAction: 'Review the current Action Center.',
    recommendationDetail: 'Start with the highest-priority item before opening dashboards or modules.',
    recommendationWhy: ['One portal action needs review.', 'Simplifi, Pulse, and updates are connected.', 'Starting here prevents dashboard hopping.'],
    dailyBrief: ['1 opportunity needs review', '2 follow-ups due', '1 watch-list match found', '4 opportunities advanced this week'],
    opportunityHealth: ['Active: Current client workspace', 'Watching: New Simplifi captures', 'Follow-Up Needed: Open commitments'],
    winWall: ['Portal workspace launched', 'Simplifi capture flow connected'],
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
    role: 'Your digital chief of staff',
    focus: ['Opportunities', 'Watch List', 'Follow-ups', 'Reminders', 'Next steps'],
    greeting: 'Good morning Robert.',
    badgeLabel: 'Opportunity Ready',
    sinceLastVisit: ['1 opportunity needs review.', '2 follow-ups are due.', '1 watch-list match was found.', '4 opportunities advanced this week.'],
    recommendedAction: 'Start with the highest-priority opportunity.',
    recommendationDetail: 'Simplifi should help you move from captured to understood, prioritized, and acted on.',
    recommendationWhy: ['Saved opportunities are waiting for next steps.', 'Follow-ups create value faster than stored notes.', 'Magnifi can turn strong captures into a shareable story.'],
    dailyBrief: ['1 opportunity needs review', '2 follow-ups due', '1 watch-list match found', '4 opportunities advanced this week'],
    opportunityHealth: ['Active: Captures ready for review', 'Watching: Golf Courses, Speakers, Athletes, Nonprofits', 'Follow-Up Needed: Saved items older than 7 days'],
    winWall: ['Three opportunities advanced this week', 'One story is ready for sharing'],
    actions: [
      { id: 'start', label: 'Start Here', kind: 'href', href: '/simplifi/capture' },
      { id: 'dashboard', label: 'View Dashboard', kind: 'href', href: '/simplifi/workspace' },
      { id: 'follow-up', label: 'Create Follow-Up', kind: 'memory' },
      { id: 'later', label: 'Later', kind: 'memory' },
    ],
    state: 'watching',
    protocolAwareness: [],
  };
}

function magnifiContext(): EAGuideContext {
  return {
    id: 'magnifi',
    product: 'Magnifi',
    role: 'Business Analyst',
    focus: ['Assessments', 'Opportunity Discovery', 'Growth Opportunities', 'Recommendations', 'Future Possibilities'],
    greeting: 'I noticed this story can become a clearer decision path.',
    badgeLabel: 'Opportunity Detected',
    sinceLastVisit: ['The opportunity narrative is ready to review.', 'Assessment and next-step signals should stay visible.', 'The strongest stories connect proof with possibility.'],
    recommendedAction: 'Review the recommendation path.',
    recommendationDetail: 'Look for the clearest transformation, then decide whether to assess, share, or follow up.',
    recommendationWhy: ['A Magnifi story is open.', 'The viewer needs the next best action.', 'Assessment and follow-up should stay close to the story.'],
    dailyBrief: ['1 story ready for review', '1 recommended next step available', 'Assessment path connected'],
    opportunityHealth: ['Active: Current Magnifi story', 'Watching: Viewer engagement', 'Follow-Up Needed: Shared opportunities without response'],
    winWall: ['Story package generated'],
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
    badgeLabel: 'Action Recommended',
    sinceLastVisit: ['Operational health is ready for review.', 'Training and engagement should be checked together.', 'One dashboard review can clarify the next action.'],
    recommendedAction: 'Review Pulse scores before moving into module work.',
    recommendationDetail: 'Pulse should explain what changed, why it matters, and what to do next.',
    recommendationWhy: ['Operating signals changed.', 'Training and engagement affect adoption together.', 'A quick review can prevent downstream drift.'],
    dailyBrief: ['1 Pulse area needs review', '1 training signal changed', '1 stakeholder update may be needed'],
    opportunityHealth: ['Active: Current Pulse dashboard', 'Watching: Engagement changes', 'Follow-Up Needed: Low-score areas'],
    winWall: ['Operational review ready'],
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
    badgeLabel: 'Follow-Up Due',
    sinceLastVisit: ['Learning progress should be checked before certification work.', 'Incomplete modules are the fastest path to regain momentum.', 'Team reminders help reduce stalled adoption.'],
    recommendedAction: 'Continue the next unfinished lesson.',
    recommendationDetail: 'Completion creates confidence, retention, and better system adoption.',
    recommendationWhy: ['A learning path is in progress.', 'Incomplete modules slow adoption.', 'Team reminders help protect momentum.'],
    dailyBrief: ['1 lesson needs continuation', '1 learner may need a reminder', 'Training progress can be advanced today'],
    opportunityHealth: ['Active: Learning path', 'Watching: Completion progress', 'Follow-Up Needed: Stalled modules'],
    winWall: ['Training hub available'],
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
    badgeLabel: 'Match Found',
    sinceLastVisit: ['Profile completeness affects exposure.', 'Film and deadlines should stay visible.', 'Family communication should point to the next milestone.'],
    recommendedAction: 'Review the next recruiting milestone.',
    recommendationDetail: 'The strongest path is profile, proof, outreach, and follow-up.',
    recommendationWhy: ['Looks like you are viewing an athlete profile.', 'Recruiting progress depends on deadlines and follow-through.', 'Family communication should stay tied to the next milestone.'],
    dailyBrief: ['1 athlete profile needs review', '1 recruiting follow-up may be due', 'Profile proof should be checked'],
    opportunityHealth: ['Active: Athlete profile', 'Watching: Recruiting progress', 'Follow-Up Needed: Outreach milestones'],
    winWall: ['Recruiting profile viewed'],
    actions: [
      { id: 'profile', label: 'Save Athlete', kind: 'memory' },
      { id: 'film', label: 'Track Recruiting Progress', kind: 'memory' },
      { id: 'watch', label: 'Add To Watch List', kind: 'memory' },
      { id: 'family', label: 'Create Family Profile', kind: 'memory' },
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
    badgeLabel: 'Action Recommended',
    sinceLastVisit: ['Updates reduce confusion when they are timely.', 'Pending requests should be resolved before new work starts.', 'Clear status language improves trust.'],
    recommendedAction: 'Create or review the next update.',
    recommendationDetail: 'Keep the message short, specific, and tied to visible progress.',
    recommendationWhy: ['You are in a communication workflow.', 'Pending updates reduce client uncertainty.', 'Clear status language improves trust.'],
    dailyBrief: ['1 update can reduce confusion', '1 pending request may need review', 'Stakeholder communication is ready'],
    opportunityHealth: ['Active: Update hub', 'Watching: Stakeholder messages', 'Follow-Up Needed: Pending requests'],
    winWall: ['Update workflow connected'],
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
    badgeLabel: 'Action Recommended',
    sinceLastVisit: ['Pipeline, delivery, and approvals should stay connected.', 'EA Factory protocols are available for build direction.', 'One administrative review can prevent downstream drift.'],
    recommendedAction: 'Review the highest-leverage operating area.',
    recommendationDetail: 'Start with the section most likely to unblock revenue, delivery, or client success.',
    recommendationWhy: ['You are in Mission Control.', 'Pipeline, delivery, and approvals affect one another.', 'EA Factory protocols are available for build direction.'],
    dailyBrief: ['1 operating area may need review', '1 approval path should stay connected', 'EA Factory protocols are ready'],
    opportunityHealth: ['Active: Mission Control', 'Watching: Revenue and delivery', 'Follow-Up Needed: Pending approvals'],
    winWall: ['Admin command center active'],
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
