import { NextRequest } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { setCustomerStaff } from '@/lib/ayf/customer-access';
import { ayfWriteDenied } from '@/lib/ayf/request-guard';

// Assignment updates never create an account, install modules or send messages.
export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'portal', slug: 'are-you-fundable' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const denied = ayfWriteDenied(req, tenant.portalSlug);
  if (denied) return denied;
  const org = await findOrganizationByPortalSlug(tenant.portalSlug);
  if (!org || org.id !== tenant.organizationId) return Response.json({ error: 'AYF unavailable' }, { status: 403 });
  try {
    await setCustomerStaff(tenant, auth.session, await req.json());
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Assignment update denied' }, { status: 403 });
  }
}
