import { NextRequest, NextResponse } from 'next/server';
import { getClientByPortalSlug } from '@/lib/airtable';
import { EA_PORTAL_COOKIE, signSession, verifySession } from '@/lib/ea-portal-auth';
import { AMANDA_OWNER_PATH, AMANDA_PORTAL_SLUG } from '@/lib/amanda-catherine/constants';

export const dynamic = 'force-dynamic';

async function authenticatedResponse(origin: string, path: string, token: string) {
  return fetch(`${origin}${path}`, {
    method: 'GET',
    headers: { cookie: `${EA_PORTAL_COOKIE}=${token}` },
    redirect: 'manual',
    cache: 'no-store',
  });
}

export async function GET(req: NextRequest) {
  const checks = {
    clientRecord: false,
    sessionSigning: false,
    sessionVerification: false,
    canonicalSlug: false,
    authenticatedOwnerRoute: false,
    authenticatedPortalHome: false,
    authenticatedMemberRoute: false,
    premiumOwnerDashboard: false,
  };

  try {
    const client = await getClientByPortalSlug(AMANDA_PORTAL_SLUG);
    checks.clientRecord = Boolean(client);

    const token = await signSession({
      slug: AMANDA_PORTAL_SLUG,
      role: 'owner',
      email: 'amanda-login-canary@efficiencyarchitects.online',
    });
    checks.sessionSigning = Boolean(token);

    const session = token ? await verifySession(token) : null;
    checks.sessionVerification = Boolean(session);
    checks.canonicalSlug = session?.slug === AMANDA_PORTAL_SLUG;

    if (token && checks.clientRecord && checks.canonicalSlug) {
      const [ownerResponse, portalHomeResponse, memberResponse] = await Promise.all([
        authenticatedResponse(req.nextUrl.origin, AMANDA_OWNER_PATH, token),
        authenticatedResponse(req.nextUrl.origin, `/portal/${AMANDA_PORTAL_SLUG}`, token),
        authenticatedResponse(req.nextUrl.origin, `/portal/${AMANDA_PORTAL_SLUG}/member`, token),
      ]);
      checks.authenticatedOwnerRoute = ownerResponse.status === 200;
      checks.authenticatedPortalHome = portalHomeResponse.status === 200;
      checks.authenticatedMemberRoute = memberResponse.status === 200;

      if (portalHomeResponse.status === 200) {
        const body = await portalHomeResponse.text();
        checks.premiumOwnerDashboard =
          body.includes('Owner portal') &&
          body.includes('Quick Actions') &&
          body.includes('Ask Eva') &&
          body.includes('Business Overview');
      }
    }

    const ok = Object.values(checks).every(Boolean);
    return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
  } catch {
    return NextResponse.json({ ok: false, checks }, { status: 503 });
  }
}
