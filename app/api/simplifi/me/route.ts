import { NextResponse } from 'next/server';
import { getClientByPortalSlug } from '@/lib/airtable';
import { requirePortalSession } from '@/lib/auth/resolve-portal-session';
import { getClientSuccessProfile } from '@/lib/client-success';
import { resolvePortalModuleAccess } from '@/lib/modules/portal-modules';
import { buildOrbUrls, resolveOrbContext } from '@/lib/orb-sdk';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { countUnreadNotifications } from '@/lib/notification-inbox';

export const dynamic = 'force-dynamic';

/** Mobile home payload — session, profile, modules, orb, notifications count. */
export async function GET() {
  const session = await requirePortalSession({ realm: 'simplifi' });
  if (!session?.email) {
    return NextResponse.json({ ok: false, error: 'Sign in required.' }, { status: 401 });
  }

  const client = await getClientByPortalSlug(session.slug);
  if (!client) {
    return NextResponse.json({ ok: false, error: 'Client not found.' }, { status: 404 });
  }

  const [profile, access, unreadCount] = await Promise.all([
    getClientSuccessProfile(client),
    resolvePortalModuleAccess({
      orgId: session.orgId,
      slug: session.slug,
      packagePurchased: client.packagePurchased,
      role: session.role,
    }),
    countUnreadNotifications(session.slug, session.email),
  ]);

  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? EA_PLATFORM_URL;

  return NextResponse.json({
    ok: true,
    session: {
      slug: session.slug,
      email: session.email,
      role: session.role,
      orgId: session.orgId,
      realm: session.realm,
    },
    client: {
      clientName: client.clientName,
      organization: client.organization ?? client.clientName,
      packagePurchased: client.packagePurchased,
      portalAccessStatus: client.portalAccessStatus,
      onboardingStatus: client.onboardingStatus,
    },
    profile: {
      operationalHealth: profile.operationalHealth,
      healthLabel: profile.healthLabel,
      summary: profile.summary,
      scores: profile.scores,
    },
    modules: {
      enabledModuleIds: [...access.enabledModuleIds],
      navTabs: access.navTabs,
    },
    notifications: { unreadCount },
    orb: resolveOrbContext('/simplifi/workspace'),
    urls: buildOrbUrls(base),
  });
}
