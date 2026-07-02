import { NextResponse } from 'next/server';
import { getClientByPortalSlug } from '@/lib/airtable';
import { requirePortalSession } from '@/lib/auth/resolve-portal-session';
import { loadSimplifiWorkspace } from '@/lib/simplifi-core';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export const dynamic = 'force-dynamic';

/** JSON workspace payload for web, PWA, and future mobile clients. */
export async function GET() {
  const session = await requirePortalSession({ realm: 'simplifi' });
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Sign in required.' }, { status: 401 });
  }

  const client = await getClientByPortalSlug(session.slug);
  const firstName = client?.clientName?.split(' ')[0] ?? '';
  const workspace = await loadSimplifiWorkspace(session.slug, EA_PLATFORM_URL, firstName);

  return NextResponse.json({
    ok: true,
    slug: session.slug,
    email: session.email,
    workspace,
  });
}
