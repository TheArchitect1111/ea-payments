import { cookies, headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { resolveSession, resolveSessionFromRequest } from '@/lib/auth/session';
import type { AuthRealm, UnifiedSession } from '@/lib/auth/types';

type PortalSession = UnifiedSession & { slug: string; email?: string };

function hasRequiredOrganization(session: UnifiedSession): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  return Boolean(session.orgId && !session.orgId.startsWith('org_'));
}

/** Resolve portal/simplifi session from cookies + Bearer (App Router route handlers). */
export async function resolvePortalSession(
  opts: { realm?: AuthRealm } = {},
): Promise<UnifiedSession | null> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  return resolveSession(
    {
      headers: headerStore,
      cookies: cookieStore,
    },
    { realm: opts.realm ?? 'portal' },
  );
}

/** Same as resolvePortalSession but accepts NextRequest (POST handlers with body). */
export function resolvePortalSessionFromRequest(
  req: NextRequest,
  opts: { realm?: AuthRealm } = {},
): Promise<UnifiedSession | null> {
  return resolveSessionFromRequest(req, { realm: opts.realm ?? 'portal' });
}

export async function requirePortalSession(
  opts: { realm?: AuthRealm } = {},
): Promise<PortalSession | null> {
  const session = await resolvePortalSession(opts);
  if (!session?.slug || !hasRequiredOrganization(session)) return null;
  return session as PortalSession;
}

export function requirePortalSessionFromRequest(
  req: NextRequest,
  opts: { realm?: AuthRealm } = {},
): Promise<PortalSession | null> {
  return resolvePortalSessionFromRequest(req, opts).then((session) => {
    if (!session?.slug || !hasRequiredOrganization(session)) return null;
    return session as PortalSession;
  });
}
