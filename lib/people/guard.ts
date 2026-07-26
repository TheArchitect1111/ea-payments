import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  guardPortalApi,
  guardPortalApiCookie,
  portalApiUnauthorized,
  type PortalApiSession,
} from '@/lib/api/portal-route';
import { normalizeRole, type PlatformRole } from '@/lib/rbac';
import { isUniversalPeopleEnabled } from '@/lib/people/flags';
import { resolvePeopleTenantFromSlug } from '@/lib/people/resolve-tenant';
import { findPersonByPrimaryEmail } from '@/lib/people/store';

export type PeopleRouteContext = {
  session: PortalApiSession;
  organizationId: string;
  portalSlug: string;
  actorRole: PlatformRole;
  actorPersonId?: string;
};

/**
 * INV-13 checklist: flag → session → slug match → org from slug → (module checked by caller).
 */
export async function guardPeopleApi(
  req: NextRequest | null,
  slug: string,
): Promise<{ ok: true; ctx: PeopleRouteContext } | { ok: false; response: NextResponse }> {
  // INV-17 hard 404 when flag OFF
  if (!isUniversalPeopleEnabled()) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 }),
    };
  }

  const auth = req
    ? await guardPortalApi(req, { slug })
    : await guardPortalApiCookie({ slug });
  if (!auth.ok) {
    return { ok: false, response: portalApiUnauthorized(auth) };
  }

  if (auth.session.slug !== slug) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: 'Portal access denied.' }, { status: 403 }),
    };
  }

  const tenant = await resolvePeopleTenantFromSlug(slug);
  if (!tenant) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: 'Organization not found' }, { status: 404 }),
    };
  }

  const actorRole = normalizeRole(auth.session.role);
  const actorPerson = auth.session.email
    ? findPersonByPrimaryEmail(tenant.organizationId, auth.session.email)
    : null;

  return {
    ok: true,
    ctx: {
      session: auth.session,
      organizationId: tenant.organizationId,
      portalSlug: tenant.portalSlug,
      actorRole,
      actorPersonId: actorPerson?.id,
    },
  };
}
