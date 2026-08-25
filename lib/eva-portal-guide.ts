export type EvaOutcomeStatus =
  | 'Answered'
  | 'Prepared for approval'
  | 'Completed'
  | 'Needs EA support';

export type EvaPortalAction = {
  label: string;
  href: string;
};

export type EvaPortalGuideContext = {
  portalSlug: string | null;
  currentModule: string;
  currentPageLabel: string;
  destination?: EvaPortalAction;
  outcome: EvaOutcomeStatus;
};

export const EVA_PORTAL_QUICK_ACTIONS = [
  'Ask about this page',
  'Find something in my portal',
  'What should I do next?',
  'Help me complete this',
  'Report a problem',
] as const;

const MODULES: Array<{
  id: string;
  label: string;
  keywords: string[];
}> = [
  { id: 'amplifi', label: 'Amplifi', keywords: ['amplifi', 'social', 'post', 'campaign', 'content', 'idea box'] },
  { id: 'simplifi', label: 'Simplifi', keywords: ['simplifi', 'capture', 'watch list', 'follow-up', 'follow up', 'attention'] },
  { id: 'documents', label: 'Documents', keywords: ['document', 'file', 'proposal', 'contract', 'pdf'] },
  { id: 'updates', label: 'Updates', keywords: ['update', 'progress', 'status'] },
  { id: 'settings', label: 'Settings', keywords: ['setting', 'administrator', 'admin', 'profile', 'preference'] },
  { id: 'billing', label: 'Billing', keywords: ['billing', 'invoice', 'payment', 'receipt'] },
  { id: 'calendar', label: 'Calendar', keywords: ['calendar', 'schedule', 'appointment', 'meeting'] },
  { id: 'events', label: 'Events', keywords: ['event', 'registration', 'tournament'] },
  { id: 'connect', label: 'Connect', keywords: ['connect', 'relationship', 'contact'] },
  { id: 'ctp', label: 'Consider The Possibilities', keywords: ['ctp', 'possibilities', 'assessment'] },
  { id: 'reports', label: 'Reports', keywords: ['report', 'analytics', 'metric', 'performance'] },
  { id: 'resources', label: 'Resources', keywords: ['resource', 'guide', 'template'] },
  { id: 'messaging', label: 'Messaging', keywords: ['message', 'email', 'communication'] },
  { id: 'notifications', label: 'Notifications', keywords: ['notification', 'alert'] },
  { id: 'people', label: 'People', keywords: ['people', 'member', 'staff', 'team'] },
  { id: 'learning', label: 'Learning', keywords: ['learning', 'training', 'course', 'lesson'] },
  { id: 'applications', label: 'Applications', keywords: ['application', 'applicant'] },
  { id: 'deliveries', label: 'Deliveries', keywords: ['delivery', 'deliverable'] },
  { id: 'intake', label: 'Intake', keywords: ['intake', 'onboarding'] },
  { id: 'pulse', label: 'Pulse', keywords: ['pulse', 'activity'] },
];

const CONSEQUENT_ACTION = /\b(publish|send|delete|remove|change price|pricing|charge|refund|cancel|invite|message client|email client)\b/i;
const SUPPORT_SIGNAL = /\b(error|broken|bug|not working|doesn't work|does not work|failed|problem|issue)\b/i;

export function portalSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/portal\/([^/]+)/);
  const slug = match?.[1] ?? null;
  if (!slug || ['login', 'register', 'forgot-password', 'reset-password', 'sign-in'].includes(slug)) return null;
  return slug;
}

export function currentPortalModule(pathname: string): { id: string; label: string } {
  const slug = portalSlugFromPath(pathname);
  if (!slug) return { id: 'portal', label: 'Portal' };
  const rest = pathname.slice(`/portal/${slug}`.length).split('/').filter(Boolean);
  const moduleId = rest[0] ?? 'home';
  if (moduleId === 'home') return { id: 'home', label: 'Home' };
  const found = MODULES.find((module) => module.id === moduleId);
  return found ? { id: found.id, label: found.label } : { id: moduleId, label: humanize(moduleId) };
}

function humanize(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function safePortalHref(portalSlug: string, moduleId: string) {
  const module = MODULES.find((item) => item.id === moduleId);
  if (!module) return null;
  return `/portal/${encodeURIComponent(portalSlug)}/${module.id}`;
}

export function resolvePortalDestination(question: string, pathname: string): EvaPortalAction | undefined {
  const portalSlug = portalSlugFromPath(pathname);
  if (!portalSlug) return undefined;
  const normalized = question.toLowerCase();
  const target = MODULES.find((module) => module.keywords.some((keyword) => normalized.includes(keyword)));
  if (!target) return undefined;
  const href = safePortalHref(portalSlug, target.id);
  if (!href || pathname === href || pathname.startsWith(`${href}/`)) return undefined;
  return { label: `Open ${target.label}`, href };
}

export function resolveEvaOutcome(question: string, hasAnswer = true): EvaOutcomeStatus {
  if (!hasAnswer || SUPPORT_SIGNAL.test(question)) return 'Needs EA support';
  if (CONSEQUENT_ACTION.test(question)) return 'Prepared for approval';
  return 'Answered';
}

export function buildEvaPortalGuideContext(question: string, pathname: string, hasAnswer = true): EvaPortalGuideContext {
  const portalSlug = portalSlugFromPath(pathname);
  const current = currentPortalModule(pathname);
  return {
    portalSlug,
    currentModule: current.id,
    currentPageLabel: current.label,
    destination: resolvePortalDestination(question, pathname),
    outcome: resolveEvaOutcome(question, hasAnswer),
  };
}
