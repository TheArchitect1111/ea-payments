/**
 * CPR portal module copy — athletics language on the EA hub chassis.
 * No CPR route cutover; overlays existing portal module pages.
 */

export type PortalModuleCopyKey =
  | 'home'
  | 'documents'
  | 'messaging'
  | 'events'
  | 'resources'
  | 'ask'
  | 'learning'
  | 'notifications'
  | 'billing';

export type PortalModuleCopy = {
  kicker: string;
  title: string;
  lede: string;
};

const CPR_MODULE_COPY: Record<PortalModuleCopyKey, PortalModuleCopy> = {
  home: {
    kicker: '{brand}',
    title: '{home}',
    lede: 'Player Focus, eligibility alerts, and family updates for {members} in {workspace}.',
  },
  documents: {
    kicker: 'Film & documents',
    title: 'Waivers, film, and shared files',
    lede: 'Onboarding packets, eligibility paperwork, and film links for {members} — kept with the recruiting pathway.',
  },
  messaging: {
    kicker: 'Family & coach',
    title: 'Messaging center',
    lede: 'Direct updates for families and coaches in {workspace}. Post a question — CPR routes it through your activity feed.',
  },
  events: {
    kicker: 'Camps & showcases',
    title: 'Upcoming touchpoints',
    lede: 'Camps, showcases, evaluations, and family sessions for {brand}.',
  },
  resources: {
    kicker: 'Recruiting toolkit',
    title: 'Guides & playbooks',
    lede: 'Parent Recruiting Guide, Connect journey, and athletics resources for {members}.',
  },
  ask: {
    kicker: 'Recruiting Advisor',
    title: 'Ask CPR',
    lede: 'Submit a recruiting question from {workspace} — the team responds through your activity feed.',
  },
  learning: {
    kicker: 'Development',
    title: 'Training & learning',
    lede: 'Development modules and family education for {members} in {workspace}.',
  },
  notifications: {
    kicker: 'Activity',
    title: 'Notification center',
    lede: 'Eligibility alerts, family updates, events, and advisor replies for {members}.',
  },
  billing: {
    kicker: 'Payments',
    title: 'Fees & invoices',
    lede: 'Manage camp fees, program payments, and invoices for {brand} through the secure billing portal.',
  },
};

export type CprPortalResource = {
  title: string;
  href: string;
  note: string;
};

export const CPR_PORTAL_RESOURCES: CprPortalResource[] = [
  {
    title: 'Parent Recruiting Guide',
    href: '/connect/cpr/go/parent-recruiting-guide?campaign=portal',
    note: 'Visibility, development, exposure, academics, and the next right conversation.',
  },
  {
    title: 'CPR Connect journey',
    href: '/connect/cpr/journey',
    note: 'Programs, camps, tryouts — Train · Compete · Grow · Succeed.',
  },
  {
    title: 'Athletics story experience',
    href: '/athletics-experience',
    note: 'Shareable cinematic story for families and partners.',
  },
  {
    title: 'Ask CPR',
    href: 'ask',
    note: 'Recruiting Advisor — routed to the CPR team.',
  },
];

export const CPR_PORTAL_EVENTS = [
  {
    title: 'Toronto Showcase follow-up',
    when: 'After showcase weekend',
    detail: 'Profile review, film cues, and parent guide delivery via Connect.',
    href: '/connect/cpr',
  },
  {
    title: 'Charlotte Tournament nurture',
    when: 'Rolling — event capture',
    detail: '42+ connections pattern: guide → FAQ → evaluation invite.',
    href: '/connect/cpr',
  },
  {
    title: 'Summer Camp evaluation',
    when: 'Camp cycle',
    detail: 'Evaluation invite and Team Portal profile updates.',
    href: '/connect/cpr/journey',
  },
  {
    title: 'Family consultation',
    when: 'By request',
    detail: 'CPR team reviews the best next recruiting step.',
    href: '/contact',
  },
];

export function getCprPortalModuleCopy(
  key: PortalModuleCopyKey,
): PortalModuleCopy | null {
  return CPR_MODULE_COPY[key] ?? null;
}

export function isCprPortalClient(platformClientId: string | undefined | null): boolean {
  return (platformClientId || '').toLowerCase() === 'cpr';
}
