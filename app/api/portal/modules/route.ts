import { NextResponse } from 'next/server';
import { guardPortalApiCookie, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { getClientByPortalSlug } from '@/lib/airtable';
import {
  applyCtpPortalModuleFilter,
  resolvePortalModuleAccess,
  toPortalSidebarNavGroups,
} from '@/lib/modules/portal-modules';

export const dynamic = 'force-dynamic';

/** Enabled modules and navigation for the current portal session. */
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
    commerceOfferId: client?.commerceOfferId,
    role: session.role,
  });
  const filtered = await applyCtpPortalModuleFilter(access, {
    portalSlug: tenant.portalSlug,
    email: session.email ?? client?.email,
  });

  return NextResponse.json({
    orgId: filtered.orgId,
    slug: tenant.portalSlug,
    role: session.role ?? null,
    enabledModuleIds: [...filtered.enabledModuleIds],
    navTabs: filtered.navTabs,
    shellNavGroups: toPortalSidebarNavGroups(filtered.shellNavGroups),
    hubModules: filtered.hubModules.map((m) => ({
      moduleId: m.moduleId,
      href: m.href,
      title: m.title,
    })),
  });
}
