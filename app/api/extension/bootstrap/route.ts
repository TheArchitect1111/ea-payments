import { NextResponse } from 'next/server';
import { requirePortalSession } from '@/lib/auth/resolve-portal-session';
import { getDemoCredentials } from '@/lib/demo-client';
import { getClientByPortalSlug } from '@/lib/airtable';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { buildOrbUrls, EXTENSION_ORB_ACTIONS, SIMPLIFI_ORB_ACTIONS } from '@/lib/orb-sdk';
import { signExtensionSession, verifyExtensionSession } from '@/lib/extension-session';
import { randomUUID } from 'node:crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await requirePortalSession({ realm: 'simplifi' });
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Sign in or start a guest session first.' }, { status: 401 });
  }

  const extensionToken = await signExtensionSession({
    slug: session.slug,
    orgId: session.orgId,
    email: session.email,
    sid: randomUUID(),
  });
  if (!extensionToken) {
    return NextResponse.json(
      { ok: false, error: 'Extension session not configured (set ADMIN_SESSION_SECRET).' },
      { status: 503 },
    );
  }

  const verified = await verifyExtensionSession(extensionToken);
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? EA_PLATFORM_URL;
  const client = await getClientByPortalSlug(session.slug);
  const demo = getDemoCredentials();
  const orbUrls = buildOrbUrls(base);

  return NextResponse.json({
    ok: true,
    apiUrl: base,
    extensionToken,
    tokenExpiresAt: verified?.exp ?? null,
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
