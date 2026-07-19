import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import { getClientByPortalSlug } from '@/lib/airtable';
import { resolvePortalIdentity } from '@/lib/org-provision';
import { signSession, makeSessionCookie } from '@/lib/ea-portal-auth';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export const dynamic = 'force-dynamic';

/** GET ?slug= — admin-only: sign portal session and land on /portal/{slug}/ctp. */
export async function GET(req: NextRequest) {
  const origin = EA_PLATFORM_URL.replace(/\/$/, '');
  const loginRedirect = NextResponse.redirect(
    new URL('/admin/login?next=/admin/show', origin),
    303,
  );

  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return loginRedirect;
  }

  const slug = (req.nextUrl.searchParams.get('slug') || '').trim().toLowerCase();
  if (!slug) {
    return NextResponse.redirect(new URL('/admin/show?error=missing-slug', origin), 303);
  }

  const client = await getClientByPortalSlug(slug);
  if (!client) {
    return NextResponse.redirect(new URL('/admin/show?error=not-found', origin), 303);
  }

  try {
    const identity = await resolvePortalIdentity({
      email: client.email,
      slug,
      clientRecordId: client.id,
    });

    const token = await signSession({
      slug,
      orgId: identity.orgId,
      role: identity.role,
      email: identity.email ?? client.email,
    });

    if (!token) {
      return NextResponse.redirect(new URL('/admin/show?error=session', origin), 303);
    }

    const res = NextResponse.redirect(new URL(`/portal/${encodeURIComponent(slug)}/ctp`, origin), 303);
    res.cookies.set(makeSessionCookie(token));
    return res;
  } catch (err) {
    console.error('[admin/show/enter] failed', err);
    return NextResponse.redirect(new URL('/admin/show?error=enter', origin), 303);
  }
}
