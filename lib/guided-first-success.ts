export type EAPlatformId =
  | 'portal'
  | 'simplifi'
  | 'magnifi'
  | 'amplifi'
  | 'pulse'
  | 'update-hub'
  | 'cpr';

export interface GuidedIntentOption {
  id: string;
  label: string;
}

export interface GuidedNextAction {
  id: string;
  label: string;
  href?: string;
  description?: string;
}

export interface GuidedPlatformConfig {
  id: EAPlatformId;
  name: string;
  tagline: string;
  successLooksLike: string;
  intents: GuidedIntentOption[];
  firstActionLabel: string;
  firstActionHref?: string;
  resultTitle: string;
  resultDetail: string;
  nextActions: GuidedNextAction[];
  coachPrompts: string[];
}

export { EA_BRAND } from '@/lib/design-system';

export const GUIDED_PLATFORMS: Record<EAPlatformId, GuidedPlatformConfig> = {
  portal: {
    id: 'portal',
    name: 'Efficiency Architects Portal',
    tagline: 'Your operating rhythm — capture, understand, amplify, and track.',
    successLooksLike: 'One capture analyzed, a Magnifi story ready, and a clear next step in Pulse.',
    intents: [
      { id: 'business', label: 'Business opportunities' },
      { id: 'visibility', label: 'Visibility & reporting' },
      { id: 'growth', label: 'Personal growth' },
      { id: 'explore', label: 'Explore the platform' },
    ],
    firstActionLabel: 'Capture your first opportunity',
    firstActionHref: '/capture',
    resultTitle: 'You are set up for success',
    resultDetail: 'Open Simplifi capture or explore a demo story — your dashboard will track what matters.',
    nextActions: [
      { id: 'capture', label: 'Capture now', href: '/capture', description: 'Simplifi → Magnifi → Amplifi' },
      { id: 'story', label: 'View Magnifi demo', href: '/story/selena', description: 'No login required' },
      { id: 'amplify', label: 'Open Amplifi', href: '/amplify', description: 'Share your story' },
      { id: 'pulse', label: 'Open Pulse', description: 'Track progress in portal' },
    ],
    coachPrompts: [
      'What should I do next?',
      'What deserves my attention?',
      'How do I capture an opportunity?',
      'How do I share a Magnifi story?',
    ],
  },
  simplifi: {
    id: 'simplifi',
    name: 'Simplifi™',
    tagline: 'Never Lose An Opportunity Again™',
    successLooksLike: 'Your first opportunity is saved and you know what to do next.',
    intents: [
      { id: 'business', label: 'Business Opportunities' },
      { id: 'clients', label: 'Potential Clients' },
      { id: 'speaking', label: 'Speaking Opportunities' },
      { id: 'recruiting', label: 'Recruiting' },
      { id: 'events', label: 'Events' },
      { id: 'personal', label: 'Personal Goals' },
    ],
    firstActionLabel: 'Capture your first opportunity',
    resultTitle: 'You are ready',
    resultDetail: 'Simplifi will help you save, organize, and act on what matters.',
    nextActions: [
      { id: 'capture', label: 'Capture now' },
      { id: 'dashboard', label: 'Go to my dashboard', href: '/simplifi/workspace' },
      { id: 'follow-up', label: 'Set a follow-up reminder' },
      { id: 'browse', label: 'Continue browsing' },
    ],
    coachPrompts: ['What should I capture?', 'What happens after I save something?', 'How does my Watch List work?'],
  },
  magnifi: {
    id: 'magnifi',
    name: 'Magnifi™',
    tagline: 'Cinematic opportunity stories that build buy-in.',
    successLooksLike: 'You have viewed a full opportunity experience and know your next step.',
    intents: [
      { id: 'prospect', label: 'Share with a prospect' },
      { id: 'stakeholder', label: 'Build internal buy-in' },
      { id: 'explore', label: 'Explore possibilities' },
    ],
    firstActionLabel: 'View the Selena demo story',
    firstActionHref: '/story/selena',
    resultTitle: 'Magnifi story ready',
    resultDetail: 'Scroll the experience, take the assessment, or book discovery when you are ready.',
    nextActions: [
      { id: 'assessment', label: 'Take assessment', href: '/assessment' },
      { id: 'capture', label: 'Create your own', href: '/capture' },
      { id: 'share', label: 'Amplifi — share link', href: '/amplify' },
    ],
    coachPrompts: ['How do I share this?', 'What is Consider vs Magnifi?'],
  },
  amplifi: {
    id: 'amplifi',
    name: 'Amplifi™',
    tagline: 'Make it visible. Share the story.',
    successLooksLike: 'You amplified a page or idea and shared the Consider link.',
    intents: [
      { id: 'share', label: 'Share an opportunity' },
      { id: 'prospect', label: 'Reach a prospect' },
      { id: 'team', label: 'Align my team' },
    ],
    firstActionLabel: 'Amplify your first link',
    resultTitle: 'Amplifi is ready',
    resultDetail: 'Tap Amplify on any URL — Simplifi analyzes in the background; you keep browsing until Magnifi is ready.',
    nextActions: [
      { id: 'amplify', label: 'Amplify now' },
      { id: 'install', label: 'Install browser button', href: '/amplifi/install' },
      { id: 'capture', label: 'Open Simplifi capture', href: '/capture' },
    ],
    coachPrompts: ['How do I install the button?', 'When will my story be ready?'],
  },
  pulse: {
    id: 'pulse',
    name: 'Pulse™',
    tagline: 'Operational health and engagement at a glance.',
    successLooksLike: 'Your dashboard reflects real activity and clear priorities.',
    intents: [
      { id: 'visibility', label: 'Visibility' },
      { id: 'reporting', label: 'Reporting' },
      { id: 'insights', label: 'Operational insights' },
    ],
    firstActionLabel: 'Review your Pulse scores',
    resultTitle: 'Pulse connected',
    resultDetail: 'Captures and portal activity feed your operational health score automatically.',
    nextActions: [
      { id: 'simplifi', label: 'Add a capture', href: '/capture' },
      { id: 'updates', label: 'Submit an update' },
    ],
    coachPrompts: ['What improves my score?', 'What deserves attention?'],
  },
  'update-hub': {
    id: 'update-hub',
    name: 'Update Hub™',
    tagline: 'Keep stakeholders informed without the chaos.',
    successLooksLike: 'Your first update is published and your audience knows what changed.',
    intents: [
      { id: 'team', label: 'Team communication' },
      { id: 'engagement', label: 'Member engagement' },
      { id: 'events', label: 'Event promotion' },
    ],
    firstActionLabel: 'Create your first update',
    resultTitle: 'Update Hub ready',
    resultDetail: 'Draft a clear update — your portal tracks status from submission to publish.',
    nextActions: [{ id: 'new', label: 'New update' }, { id: 'enhance', label: 'Request enhancement' }],
    coachPrompts: ['How do I submit an update?', 'What happens after I submit?'],
  },
  cpr: {
    id: 'cpr',
    name: 'CPR™ Family Portal',
    tagline: 'Recruiting exposure, coach connections, and your path to the next level.',
    successLooksLike: 'Your athlete profile is started and you know the next recruiting step.',
    intents: [
      { id: 'exposure', label: 'Recruiting exposure' },
      { id: 'coaches', label: 'Coach connections' },
      { id: 'scholarship', label: 'Scholarship opportunities' },
      { id: 'development', label: 'Player development' },
    ],
    firstActionLabel: 'Complete athlete profile',
    resultTitle: 'Welcome to CPR',
    resultDetail: 'Your portal hub tracks outreach, documents, and next steps — never an empty screen.',
    nextActions: [
      { id: 'profile', label: 'Update profile' },
      { id: 'timeline', label: 'View recruiting timeline' },
      { id: 'messages', label: 'Open messages' },
    ],
    coachPrompts: ['What should I do next?', 'How does coach outreach work?'],
  },
};

export function gfsStorageKey(platform: EAPlatformId, scope: string): string {
  return `ea-gfs-v1-${platform}-${scope}`;
}

export function isGfsComplete(platform: EAPlatformId, scope: string): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(gfsStorageKey(platform, scope)) === 'complete';
}

export function markGfsComplete(platform: EAPlatformId, scope: string, intentId?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(gfsStorageKey(platform, scope), 'complete');
  if (intentId) {
    localStorage.setItem(`${gfsStorageKey(platform, scope)}-intent`, intentId);
  }
}

export function getStoredIntent(platform: EAPlatformId, scope: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`${gfsStorageKey(platform, scope)}-intent`);
}

export interface ActionCenterItem {
  id: string;
  title: string;
  detail: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  href?: string;
  cta?: string;
}

export function buildPortalActionCenter(input: {
  slug: string;
  captureCount: number;
  opportunityCount: number;
  hasDemoStory?: boolean;
}): ActionCenterItem[] {
  const items: ActionCenterItem[] = [];
  const base = `/portal/${input.slug}`;

  if (input.captureCount === 0) {
    items.push({
      id: 'first-capture',
      title: 'Capture your first opportunity',
      detail: 'Simplifi analyzes in the background — Magnifi builds automatically.',
      priority: 'high',
      href: '/capture',
      cta: 'Capture now',
    });
  }

  if (input.opportunityCount > 0) {
    items.push({
      id: 'share-ready',
      title: 'Magnifi story ready to share',
      detail: `${input.opportunityCount} opportunity experience(s) in Pulse.`,
      priority: 'high',
      href: `${base}/amplifi`,
      cta: 'Open Amplifi',
    });
  }

  items.push({
    id: 'magnifi-demo',
    title: 'Explore Magnifi demo',
    detail: 'See a full Consider experience — no login required.',
    priority: 'medium',
    href: '/story/selena',
    cta: 'View story',
  });

  items.push({
    id: 'pulse-review',
    title: 'Review Pulse scores',
    detail: 'Operational health updates as you capture and engage.',
    priority: 'medium',
    href: `${base}/pulse`,
    cta: 'Open Pulse',
  });

  return items.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
}
