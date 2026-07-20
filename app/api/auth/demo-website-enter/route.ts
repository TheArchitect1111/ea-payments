import { NextResponse, type NextRequest } from 'next/server';
import {
  ensureDemoWebsitePortal,
  getDemoWebsitePortalCredentials,
} from '@/lib/demo-website-portal';
import { signSession, makeSessionCookie } from '@/lib/ea-portal-auth';
import { resolvePortalIdentity } from '@/lib/org-provision';
import { opportunityDashboardPath } from '@/lib/ctp-opportunity-routes';

export const dynamic = 'force-dynamic';

/** Always apex — www may still map to the legacy app; cookies must match host. */
const HUB_ORIGIN = 'https://efficiencyarchitects.online';

/** Only same-origin relative paths; default = Website + Portal Client Experience. */
function safeDemoNext(raw: string | null, slug: string): string {
  const fallback = opportunityDashboardPath(slug);
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback;
  return raw;
}

/**
 * One-click Website + Portal demo entry (not Simplifi demo-client).
 * GET /api/auth/demo-website-enter → session → /portal/demo-website/ctp
 */
function resolveEnterOrigin(req: NextRequest): string {
  const host = req.nextUrl.host || '';
  if (host.includes('localhost') || host.startsWith('127.0.0.1')) {
    return req.nextUrl.origin;
  }
  return HUB_ORIGIN;
}

export async function GET(req: NextRequest) {
  const demo = getDemoWebsitePortalCredentials();
  const origin = resolveEnterOrigin(req);
  const next = safeDemoNext(req.nextUrl.searchParams.get('next'), demo.slug);

  try {
    const provision = await ensureDemoWebsitePortal();
    if (!provision.ok) {
      return NextResponse.redirect(
        new URL(
          `/portal/login?error=config&detail=${encodeURIComponent(provision.error || 'demo-website')}`,
          origin,
        ),
        303,
      );
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
    console.error('[demo-website-enter] failed', err);
    return NextResponse.redirect(new URL('/portal/login?error=config', origin), 303);
  }
}
