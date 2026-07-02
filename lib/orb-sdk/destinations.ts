import type { OrbActionKind } from './types';

export type OrbDestination = {
  id: string;
  label: string;
  description: string;
  kind: OrbActionKind;
  href?: string;
  event?: string;
};

function portalSlug(pathname: string, sessionSlug?: string | null): string {
  const match = pathname.match(/\/portal\/([^/]+)/);
  const fromPath = match?.[1] ?? '';
  if (fromPath && !['login', 'register', 'forgot-password', 'reset-password', 'sign-in'].includes(fromPath)) {
    return fromPath;
  }
  const slug = sessionSlug?.trim() ?? '';
  if (slug && !['login', 'register', 'forgot-password', 'reset-password', 'sign-in'].includes(slug)) {
    return slug;
  }
  return '';
}

/** Six primary Orb destinations — Instant Feel Standard™ bloom menu. */
export function resolveOrbDestinations(pathname: string, sessionSlug?: string | null): OrbDestination[] {
  const slug = portalSlug(pathname, sessionSlug);
  const portal = slug ? `/portal/${slug}` : '';

  const all: OrbDestination[] = [
    {
      id: 'capture',
      label: 'Capture',
      description: 'Save a URL or photo in seconds',
      kind: 'capture',
      href: '/simplifi/capture',
    },
    {
      id: 'workspace',
      label: 'Workspace',
      description: 'Review opportunities and next steps',
      kind: 'navigate',
      href: slug ? `${portal}/simplifi` : '/simplifi/workspace',
    },
    {
      id: 'pulse',
      label: 'Pulse',
      description: 'Operating signals and health scores',
      kind: 'navigate',
      href: slug ? `${portal}/pulse` : '/portal/login?next=/portal/demo-client/pulse',
    },
    {
      id: 'amplifi',
      label: 'Amplifi',
      description: 'Share your story with the world',
      kind: 'navigate',
      href: slug ? `${portal}/amplifi` : '/amplifi',
    },
    {
      id: 'updates',
      label: 'Updates',
      description: 'Announcements and family feed',
      kind: 'navigate',
      href: slug ? `${portal}/updates` : '/portal/login?next=/portal/demo-client/updates',
    },
    {
      id: 'guide',
      label: 'EA Guide',
      description: 'Ask questions and walkthroughs',
      kind: 'guide',
      event: 'ea-guide:open-panel',
    },
  ];

  if (pathname.includes('/simplifi') || pathname.includes('/capture')) {
    return [all[0], all[1], all[5], all[2], all[3], all[4]];
  }
  if (pathname.includes('/pulse')) {
    return [all[2], all[0], all[1], all[4], all[3], all[5]];
  }
  if (pathname.includes('/amplifi')) {
    return [all[3], all[0], all[1], all[2], all[4], all[5]];
  }
  if (pathname.includes('/updates')) {
    return [all[4], all[0], all[2], all[1], all[3], all[5]];
  }

  return all;
}
