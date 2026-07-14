import { NextResponse } from 'next/server';
import { ensureDemoClient, getDemoCredentials } from '@/lib/demo-client';
import { ensureDemoConnectTenant } from '@/lib/connect-provision';
import { signSession, makeSessionCookie } from '@/lib/ea-portal-auth';
import { resolvePortalIdentity } from '@/lib/org-provision';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export const dynamic = 'force-dynamic';

/**
 * One-click demo portal entry — no email.
 * GET /api/auth/demo-enter → sets session cookie → /portal/demo-client/ctp
 */
export async function GET() {
  const demo = getDemoCredentials();
  const origin = EA_PLATFORM_URL.replace(/\/$/, '') || 'https://efficiencyarchitects.online';

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

    const res = NextResponse.redirect(new URL(`/portal/${demo.slug}/ctp`, origin), 303);
    res.cookies.set(makeSessionCookie(token));
    return res;
  } catch (err) {
    console.error('[demo-enter] failed', err);
    return NextResponse.redirect(new URL('/portal/login?error=config', origin), 303);
  }
}
