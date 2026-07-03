import { NextResponse } from 'next/server';
import { guardPortalApiCookie, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { getClientByPortalSlug } from '@/lib/airtable';
import { resolvePortalModuleAccess } from '@/lib/modules/portal-modules';

export const dynamic = 'force-dynamic';

/** Enabled modules for the current portal session. */
export async function GET() {
  const auth = await guardPortalApiCookie();
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const session = auth.session;

  const client = await getClientByPortalSlug(tenant.portalSlug);
  const access = await resolvePortalModuleAccess({
    orgId: tenant.organizationId,
    slug: tenant.portalSlug,
    packagePurchased: client?.packagePurchased,
    role: session.role,
  });

  return NextResponse.json({
    orgId: access.orgId,
    slug: tenant.portalSlug,
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
