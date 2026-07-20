import { NextResponse, type NextRequest } from 'next/server';
import { ensureDemoClient, getDemoCredentials } from '@/lib/demo-client';
import { ensureDemoConnectTenant } from '@/lib/connect-provision';
import { signSession, makeSessionCookie } from '@/lib/ea-portal-auth';
import { resolvePortalIdentity } from '@/lib/org-provision';
export const dynamic = 'force-dynamic';

/** Always apex — www may still map to the legacy app; cookies must match host. */
const HUB_ORIGIN = 'https://efficiencyarchitects.online';

/** Only same-origin relative paths are honored; default = Guide Progress. */
function safeDemoNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/portal/demo-client/ctp/progress';
  }
  return raw;
}

/**
 * One-click demo portal entry — no email.
 * GET /api/auth/demo-enter → sets session cookie → /portal/demo-client/ctp/progress
 * Optional ?next=/simplifi/workspace lands testers on the Simplifi Brief instead.
 */
export async function GET(req: NextRequest) {
  const demo = getDemoCredentials();
  const origin = HUB_ORIGIN;
  const next = safeDemoNext(req.nextUrl.searchParams.get('next'));

  try {
    const provision = await ensureDemoClient();
    if (!provision.ok) {
      return NextResponse.redirect(
        new URL(`/portal/login?error=config&detail=${encodeURIComponent(provision.error || 'demo')}`, origin),
        303,
      );
    }

    try {
      await ensureDemoConnectTenant();
    } catch {
      // non-fatal for portal entry
    }

    const identity = await resolvePortalIdentity({
      email: demo.email,
      slug: demo.slug,
    });

    const token = await signSession({
      slug: demo.slug,
      orgId: identity.orgId,
      role: identity.role,
      email: identity.email ?? demo.email,
    });

    if (!token) {
      return NextResponse.redirect(new URL('/portal/login?error=config', origin), 303);
    }

    const res = NextResponse.redirect(new URL(next, origin), 303);
    res.cookies.set(makeSessionCookie(token));
    return res;
  } catch (err) {
    console.error('[demo-enter] failed', err);
    return NextResponse.redirect(new URL('/portal/login?error=config', origin), 303);
  }
}
