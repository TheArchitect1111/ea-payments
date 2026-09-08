import { NextResponse } from 'next/server';
import { getClientByPortalSlug } from '@/lib/airtable';
import { signSession, verifySession } from '@/lib/ea-portal-auth';
import { AMANDA_PORTAL_SLUG } from '@/lib/amanda-catherine/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    clientRecord: false,
    sessionSigning: false,
    sessionVerification: false,
    canonicalSlug: false,
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

    const ok = Object.values(checks).every(Boolean);
    return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
  } catch {
    return NextResponse.json({ ok: false, checks }, { status: 503 });
  }
}
