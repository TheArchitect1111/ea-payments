import { NextResponse, type NextRequest } from 'next/server';
import { ensureDemoClient, getDemoCredentials } from '@/lib/demo-client';
import { ensureDemoConnectTenant } from '@/lib/connect-provision';
import {
  ensureDemoWebsitePortal,
  getDemoWebsitePortalCredentials,
} from '@/lib/demo-website-portal';
import { signSession, makeSessionCookie } from '@/lib/ea-portal-auth';
import { resolvePortalIdentity } from '@/lib/org-provision';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';

export const dynamic = 'force-dynamic';

/** Always apex — www may still map to the legacy app; cookies must match host. */
const HUB_ORIGIN = 'https://efficiencyarchitects.online';

function resolveEnterOrigin(req: NextRequest): string {
  const host = req.nextUrl.host || '';
  if (host.includes('localhost') || host.startsWith('127.0.0.1')) {
    return req.nextUrl.origin;
  }
  return HUB_ORIGIN;
}

function wantsSimplifiDemo(raw: string | null): boolean {
  if (!raw) return false;
  if (raw.startsWith('/simplifi')) return true;
  if (raw.startsWith('/portal/demo-client') && !raw.includes('/ctp')) return true;
  return false;
}

/**
 * One-click demo entry.
 * Default → Website + Portal Client Experience (Guide Progress).
 * ?next=/simplifi/... or /portal/demo-client → Simplifi demo-client.
 */
export async function GET(req: NextRequest) {
  const origin = resolveEnterOrigin(req);
  const rawNext = req.nextUrl.searchParams.get('next');

  try {
    if (wantsSimplifiDemo(rawNext)) {
      const demo = getDemoCredentials();
      const next =
        rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')
          ? rawNext
          : `/portal/${demo.slug}`;

      const provision = await ensureDemoClient();
      if (!provision.ok) {
        return NextResponse.redirect(
          new URL(
            `/portal/login?error=config&detail=${encodeURIComponent(provision.error || 'demo')}`,
            origin,
          ),
          303,
        );
      }

      try {
        await ensureDemoConnectTenant();
      } catch {
        // non-fatal
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
    }

    // Client Experience — Website + Portal Guide Progress
    const demo = getDemoWebsitePortalCredentials();
    const next =
      rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')
        ? rawNext
        : designStudioPath(demo.slug);

    const provision = await ensureDemoWebsitePortal();
    if (!provision.ok) {
      return NextResponse.redirect(
        new URL(
          `/portal/login?error=config&detail=${encodeURIComponent(
            provision.error || 'Could not open Client Experience demo.',
          )}`,
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
    console.error('[demo-enter] failed', err);
    return NextResponse.redirect(new URL('/portal/login?error=config', origin), 303);
  }
}
