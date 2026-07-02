import { NextResponse } from 'next/server';
import { requirePortalSession } from '@/lib/auth/resolve-portal-session';
import { getCaptureApiKey } from '@/lib/capture-api-key';
import { getDemoCredentials } from '@/lib/demo-client';
import { getClientByPortalSlug } from '@/lib/airtable';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { buildOrbUrls, EXTENSION_ORB_ACTIONS, SIMPLIFI_ORB_ACTIONS } from '@/lib/orb-sdk';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await requirePortalSession({ realm: 'simplifi' });
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
  const orbUrls = buildOrbUrls(base);

  return NextResponse.json({
    ok: true,
    apiUrl: base,
    apiKey,
    portalSlug: session.slug,
    notifyEmail: client?.email ?? (session.slug === demo.slug ? demo.email : undefined),
    orb: {
      product: 'simplifi',
      urls: orbUrls,
      actions: SIMPLIFI_ORB_ACTIONS,
      extensionActions: EXTENSION_ORB_ACTIONS,
    },
  });
}
