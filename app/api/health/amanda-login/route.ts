import { NextRequest, NextResponse } from 'next/server';
import { getClientByPortalSlug } from '@/lib/airtable';
import { EA_PORTAL_COOKIE, signSession, verifySession } from '@/lib/ea-portal-auth';
import { AMANDA_OWNER_PATH, AMANDA_PORTAL_SLUG } from '@/lib/amanda-catherine/constants';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const checks = {
    clientRecord: false,
    sessionSigning: false,
    sessionVerification: false,
    canonicalSlug: false,
    authenticatedOwnerRoute: false,
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
      const ownerResponse = await fetch(`${req.nextUrl.origin}${AMANDA_OWNER_PATH}`, {
        method: 'GET',
        headers: { cookie: `${EA_PORTAL_COOKIE}=${token}` },
        redirect: 'manual',
        cache: 'no-store',
      });
      checks.authenticatedOwnerRoute = ownerResponse.status === 200;
    }

    const ok = Object.values(checks).every(Boolean);
    return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
  } catch {
    return NextResponse.json({ ok: false, checks }, { status: 503 });
  }
}
