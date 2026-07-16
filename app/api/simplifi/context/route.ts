import { NextRequest, NextResponse } from 'next/server';
import { resolveOrbContext } from '@/lib/orb-sdk';
import { requirePortalSessionFromRequest } from '@/lib/auth/resolve-portal-session';

export const dynamic = 'force-dynamic';

/** Orb context + optional session for mobile/PWA clients. */
export async function GET(req: NextRequest) {
  const pathname = req.nextUrl.searchParams.get('pathname')?.trim() || '/simplifi/workspace';
  const orb = resolveOrbContext(pathname);
  const session = await requirePortalSessionFromRequest(req, { realm: 'simplifi' });

  return NextResponse.json({
    ok: true,
    orb,
    session: session
      ? {
          slug: session.slug,
          email: session.email,
          realm: session.realm,
          orgId: session.orgId,
          role: session.role,
        }
      : null,
    authenticated: Boolean(session),
  });
}
