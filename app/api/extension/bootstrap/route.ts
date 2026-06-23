import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getCaptureApiKey } from '@/lib/capture-api-key';
import { getDemoCredentials } from '@/lib/demo-client';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    return NextResponse.json({ ok: false, error: 'Sign in or start a guest session first.' }, { status: 401 });
  }

  const apiKey = getCaptureApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'Capture API not configured (set EA_CAPTURE_API_KEY or ADMIN_SESSION_SECRET).' },
      { status: 503 },
    );
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? EA_PLATFORM_URL;
  const client = await getClientByPortalSlug(session.slug);
  const demo = getDemoCredentials();

  return NextResponse.json({
    ok: true,
    apiUrl: base,
    apiKey,
    portalSlug: session.slug,
    notifyEmail: client?.email ?? (session.slug === demo.slug ? demo.email : undefined),
  });
}
