export const SIMPLIFI_ONBOARDING_KEY = 'ea-simplifi-onboarding-v3';
export const SIMPLIFI_WATCH_CATEGORIES_KEY = 'ea-simplifi-watch-categories';
export const SIMPLIFI_WATCH_ACTIVE_KEY = 'ea-simplifi-watch-active';
export const SIMPLIFI_CAPTURE_COUNT_KEY = 'ea-simplifi-capture-count';
export const SIMPLIFI_GUIDE_INTRO_KEY = 'ea-simplifi-guide-intro';

export type SimplifiOnboardingStep =
  | 'flight-welcome'
  | 'flight-orb'
  | 'flight-brief'
  | 'flight-ai'
  | 'flight-begin'
  | 'welcome'
  | 'interests'
  | 'watchlist'
  | 'first-capture'
  | 'capture-success'
  | 'explain'
  | 'complete';

export const WATCH_LIST_CATEGORIES = [
  { id: 'business', label: 'Business Opportunities' },
  { id: 'clients', label: 'Potential Clients' },
  { id: 'partnerships', label: 'Partnerships' },
  { id: 'speaking', label: 'Speaking Opportunities' },
  { id: 'investments', label: 'Investments' },
  { id: 'recruiting', label: 'Recruiting' },
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'events', label: 'Events' },
  { id: 'networking', label: 'Networking' },
  { id: 'content', label: 'Content Ideas' },
  { id: 'training', label: 'Training' },
  { id: 'personal-goals', label: 'Personal Goals' },
  { id: 'scholarships', label: 'Scholarships' },
  { id: 'athletes', label: 'Athletes' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'other', label: 'Other (Custom)' },
] as const;

export const WATCH_LIST_EXAMPLES = [
  'Looking for speaking engagements',
  'Looking for new clients',
  'Looking for sponsors',
  'Looking for basketball prospects',
  'Looking for investment opportunities',
  'Looking for volunteers',
  'Looking for coaching opportunities',
];

export const SIMPLIFI_FLOW_STEPS = [
  'Discover',
  'Capture',
  'Organize',
  'Prioritize',
  'Follow Up',
  'Create Value',
] as const;

function scopedKey(base: string, scope: string) {
  return `${base}-${scope}`;
}

export function getOnboardingStep(scope: string): SimplifiOnboardingStep | null {
  if (typeof window === 'undefined') return null;
  if (isOnboardingComplete(scope)) return null;
  const raw = localStorage.getItem(scopedKey(SIMPLIFI_ONBOARDING_KEY, scope));
  if (!raw || raw === 'complete') return 'flight-welcome';
  if (raw === 'welcome' || raw === 'interests' || raw === 'watchlist' || raw === 'explain') return 'flight-welcome';
  return raw as SimplifiOnboardingStep;
}

export function setOnboardingStep(scope: string, step: SimplifiOnboardingStep) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(scopedKey(SIMPLIFI_ONBOARDING_KEY, scope), step);
}

export function isOnboardingComplete(scope: string): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(scopedKey(SIMPLIFI_ONBOARDING_KEY, scope)) === 'complete';
}

export function markOnboardingComplete(scope: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(scopedKey(SIMPLIFI_ONBOARDING_KEY, scope), 'complete');
}

export function getWatchCategories(scope: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(scopedKey(SIMPLIFI_WATCH_CATEGORIES_KEY, scope));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveWatchCategories(scope: string, categories: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(scopedKey(SIMPLIFI_WATCH_CATEGORIES_KEY, scope), JSON.stringify(categories));
}

export function getActiveWatchList(scope: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(scopedKey(SIMPLIFI_WATCH_ACTIVE_KEY, scope));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveActiveWatchList(scope: string, entries: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(scopedKey(SIMPLIFI_WATCH_ACTIVE_KEY, scope), JSON.stringify(entries));
}

export function getCaptureCount(scope: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(scopedKey(SIMPLIFI_CAPTURE_COUNT_KEY, scope));
  return raw ? Number(raw) || 0 : 0;
}

export function incrementCaptureCount(scope: string): number {
  const next = getCaptureCount(scope) + 1;
  if (typeof window !== 'undefined') {
    localStorage.setItem(scopedKey(SIMPLIFI_CAPTURE_COUNT_KEY, scope), String(next));
  }
  return next;
}

export function hasGuideIntroduced(scope: string): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(scopedKey(SIMPLIFI_GUIDE_INTRO_KEY, scope)) === '1';
}

export function markGuideIntroduced(scope: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(scopedKey(SIMPLIFI_GUIDE_INTRO_KEY, scope), '1');
}

export function shouldShowGuideRecommendations(scope: string): boolean {
  return (
    getCaptureCount(scope) > 0 ||
    getActiveWatchList(scope).length > 0 ||
    getWatchCategories(scope).length > 0
  );
}

export function onboardingStepNumber(step: SimplifiOnboardingStep): number {
  const order: SimplifiOnboardingStep[] = [
    'flight-welcome',
    'flight-orb',
    'flight-brief',
    'flight-ai',
    'flight-begin',
    'complete',
  ];
  return order.indexOf(step) + 1;
}
