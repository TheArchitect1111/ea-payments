import { NextResponse } from 'next/server';
import { requirePortalSession } from '@/lib/auth/resolve-portal-session';
import { getClientByPortalSlug } from '@/lib/airtable';
import { resolvePortalModuleAccess } from '@/lib/modules/portal-modules';

export const dynamic = 'force-dynamic';

/** Enabled modules for the current portal session. */
export async function GET() {
  const session = await requirePortalSession();
  if (!session?.slug) {
    return NextResponse.json({ error: 'Portal authentication required.' }, { status: 401 });
  }

  const client = await getClientByPortalSlug(session.slug);
  const access = await resolvePortalModuleAccess({
    orgId: session.orgId,
    slug: session.slug,
    packagePurchased: client?.packagePurchased,
    role: session.role,
  });

  return NextResponse.json({
    orgId: access.orgId,
    slug: session.slug,
    role: session.role ?? null,
    enabledModuleIds: [...access.enabledModuleIds],
    navTabs: access.navTabs,
    hubModules: access.hubModules.map((m) => ({
      moduleId: m.moduleId,
      href: m.href,
      title: m.title,
    })),
  });
}
