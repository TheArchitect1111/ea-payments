import type { EAUserRole, EAPortalType, GuidePageContext } from './ea-guide-types';

function portalSlug(pathname: string) {
  const match = pathname.match(/\/portal\/([^/]+)/);
  const slug = match?.[1] ?? '';
  if (['login', 'register', 'forgot-password', 'reset-password'].includes(slug)) return '';
  return slug;
}

export function resolvePortalType(pathname: string): EAPortalType {
  if (pathname.includes('/discover') || pathname.includes('/assessment')) return 'discover';
  if (pathname.includes('/passport')) return 'passport';
  if (pathname.includes('/pulse')) return 'pulse';
  if (pathname.includes('/learning') || pathname.includes('/academy')) return 'training';
  if (pathname.includes('/updates')) return 'update-hub';
  if (pathname.includes('/cpr') || pathname.includes('/athlete')) return 'cpr';
  if (pathname.includes('/volunteer')) return 'volunteer';
  if (pathname.includes('/family')) return 'family';
  if (pathname.includes('/event')) return 'event';
  if (pathname.startsWith('/s/')) return 'landing';
  if (pathname.includes('/simplifi')) return 'simplifi';
  if (pathname.includes('/consider') || pathname.includes('/magnifi')) return 'magnifi';
  if (pathname.includes('/admin')) return 'admin';
  if (pathname.includes('/portal')) return 'client';
  if (pathname === '/' || pathname.includes('/story')) return 'portal';
  return 'unknown';
}

export function resolveUserRole(pathname: string): EAUserRole {
  if (pathname.includes('/admin')) return 'admin';
  if (pathname.includes('/volunteer')) return 'volunteer';
  if (pathname.includes('/family') || pathname.includes('/cpr')) return 'family';
  if (pathname.includes('/academy') || pathname.includes('/learning')) return 'learner';
  if (pathname.includes('/portal/login') || pathname.includes('/discover') || pathname.includes('/assessment')) {
    return 'guest';
  }
  if (portalSlug(pathname)) return 'client';
  return 'guest';
}

export function resolveWorkflow(pathname: string, portalType: EAPortalType): string | undefined {
  if (pathname.includes('/upload')) return 'uploads';
  if (pathname.includes('/blueprint')) return 'blueprint';
  if (pathname.includes('/proposal') || pathname.includes('/approval')) return 'proposal';
  if (pathname.includes('/payment') || pathname.includes('/billing')) return 'payments';
  if (pathname.includes('/timeline') || pathname.includes('/implementation')) return 'timeline';
  if (pathname.includes('/training') || pathname.includes('/academy')) return 'training';
  if (pathname.includes('/messages') || pathname.includes('/updates')) return 'messages';
  if (pathname.includes('/documents')) return 'documents';
  if (portalType === 'discover') return 'discover';
  if (portalType === 'passport') return 'passport';
  if (portalType === 'admin' && pathname.includes('/master')) return 'admin-dashboard';
  if (portalType === 'pulse') return 'pulse-dashboard';
  return undefined;
}

function portalLabel(portalType: EAPortalType, pathname: string): string {
  const labels: Record<EAPortalType, string> = {
    pulse: 'Pulse™',
    passport: 'Passport to Possibilities™',
    discover: 'Discover The Possibilities™',
    client: 'Client Portal',
    admin: 'Admin Portal',
    training: 'Training Hub',
    family: 'Family Portal',
    volunteer: 'Volunteer Portal',
    event: 'Event Portal',
    landing: 'Landing Page',
    simplifi: 'Simplifi™',
    magnifi: 'Magnifi™',
    cpr: 'CPR',
    'update-hub': 'Update Hub',
    portal: 'EA Platform',
    unknown: 'EA Platform',
  };
  const base = labels[portalType];
  const slug = portalSlug(pathname);
  return slug ? `${base} · ${slug}` : base;
}

export function resolveGuidePageContext(pathname: string, userId?: string): GuidePageContext {
  const portalType = resolvePortalType(pathname);
  const role = resolveUserRole(pathname);
  const workflow = resolveWorkflow(pathname, portalType);
  const organizationId = portalSlug(pathname) || undefined;

  return {
    portalType,
    role,
    pathname,
    label: portalLabel(portalType, pathname),
    workflow,
    organizationId,
    userId,
  };
}

export function routeMatchesPattern(pathname: string, pattern: string): boolean {
  try {
    return new RegExp(pattern, 'i').test(pathname);
  } catch {
    return pathname.includes(pattern);
  }
}

export function roleAllowed(roles: EAUserRole[] | undefined, role: EAUserRole): boolean {
  if (!roles?.length) return true;
  return roles.includes(role);
}
