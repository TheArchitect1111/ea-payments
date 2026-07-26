import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  guardPortalApi,
  guardPortalApiCookie,
  portalApiUnauthorized,
  type PortalApiSession,
} from '@/lib/api/portal-route';
import { normalizeRole, type PlatformRole } from '@/lib/rbac';
import { getPeopleRepository } from '@/lib/people/adapter';
import { isPeoplePersistError } from '@/lib/people/errors';
import {
  isPeopleRuntimeAllowed,
  isUniversalPeoplePersistEnabled,
  peopleRuntimeDenyReason,
} from '@/lib/people/flags';
import { incPeopleMetric } from '@/lib/people/metrics';
import { logPeopleFailure } from '@/lib/people/redact-log';
import { resolvePeopleTenantFromSlug } from '@/lib/people/resolve-tenant';
import type { PeopleRepository } from '@/lib/people/repository';

export type PeopleRouteContext = {
  session: PortalApiSession;
  organizationId: string;
  portalSlug: string;
  actorRole: PlatformRole;
  actorPersonId?: string;
  repository: PeopleRepository;
};

function notFound(): NextResponse {
  return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
}

/** Maps a persistence error to a fail-closed response (INV-19/20). */
export function peopleErrorResponse(error: unknown): NextResponse {
  if (isPeoplePersistError(error)) {
    if (error.code === 'illegal_flag') {
      incPeopleMetric('people_illegal_flag_denied', 'route');
      return notFound();
    }
    if (error.code === 'unavailable') incPeopleMetric('people_fail_closed', 'route');
    return NextResponse.json({ ok: false, error: error.code }, { status: error.httpStatus });
  }
  logPeopleFailure('route', error);
  return NextResponse.json({ ok: false, error: 'people_error' }, { status: 500 });
}

/**
 * INV-13 checklist: flag → INV-20 legality → session → slug match → org from slug →
 * repository readiness (INV-19) → actor person resolution.
 */
export async function guardPeopleApi(
  req: NextRequest | null,
  slug: string,
): Promise<{ ok: true; ctx: PeopleRouteContext } | { ok: false; response: NextResponse }> {
  // INV-17 hard 404 when flag OFF; INV-20 hard 404 for the illegal flag combination.
  if (!isPeopleRuntimeAllowed()) {
    if (peopleRuntimeDenyReason() === 'persist_required') {
      incPeopleMetric('people_illegal_flag_denied', 'guard');
    }
    return { ok: false, response: notFound() };
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

  // Persist ON without Postgres configured → 503, never a memory/Airtable fallback (INV-19/33).
  let repository: PeopleRepository;
  try {
    repository = getPeopleRepository();
  } catch (error) {
    return { ok: false, response: peopleErrorResponse(error) };
  }

  if (isUniversalPeoplePersistEnabled() && repository.kind !== 'postgres') {
    incPeopleMetric('people_fail_closed', 'guard');
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: 'unavailable' }, { status: 503 }),
    };
  }

  const actorRole = normalizeRole(auth.session.role);
  let actorPersonId: string | undefined;
  if (auth.session.email) {
    try {
      const actorPerson = await repository.findPersonByEmail(
        tenant.organizationId,
        auth.session.email,
      );
      actorPersonId = actorPerson?.id;
    } catch (error) {
      return { ok: false, response: peopleErrorResponse(error) };
    }
  }

  return {
    ok: true,
    ctx: {
      session: auth.session,
      organizationId: tenant.organizationId,
      portalSlug: tenant.portalSlug,
      actorRole,
      actorPersonId,
      repository,
    },
  };
}
