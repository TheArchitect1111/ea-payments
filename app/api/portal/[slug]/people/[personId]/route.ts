import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { roleAtLeast } from '@/lib/rbac';
import { assertPeopleAccess, redactPersonForActor } from '@/lib/people/acl';
import { guardPeopleApi } from '@/lib/people/guard';
import { ignoreBodyOrganizationId } from '@/lib/people/resolve-tenant';
import {
  appendPeopleAudit,
  getPersonById,
  updatePerson,
} from '@/lib/people/store';

type Ctx = { params: Promise<{ slug: string; personId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { slug, personId } = await ctx.params;
  const gated = await guardPeopleApi(req, slug);
  if (!gated.ok) return gated.response;

  const access = await assertPeopleAccess({
    organizationId: gated.ctx.organizationId,
    portalSlug: gated.ctx.portalSlug,
    actor: {
      email: gated.ctx.session.email,
      role: gated.ctx.actorRole,
      personId: gated.ctx.actorPersonId,
    },
    resourceType: 'person',
    resourceId: personId,
    relationNeeded: ['viewer', 'self', 'guardian', 'org_admin', 'editor'],
  });

  if (!access.ok) {
    const status = access.code === 'not_found' ? 404 : 403;
    return NextResponse.json({ ok: false, error: access.code }, { status });
  }

  const person = getPersonById(personId);
  if (!person) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    person: redactPersonForActor(
      {
        email: gated.ctx.session.email,
        role: gated.ctx.actorRole,
        personId: gated.ctx.actorPersonId,
      },
      person,
      { relation: access.relation },
    ),
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { slug, personId } = await ctx.params;
  const gated = await guardPeopleApi(req, slug);
  if (!gated.ok) return gated.response;

  if (!roleAtLeast(gated.ctx.actorRole, 'staff')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const access = await assertPeopleAccess({
    organizationId: gated.ctx.organizationId,
    portalSlug: gated.ctx.portalSlug,
    actor: {
      email: gated.ctx.session.email,
      role: gated.ctx.actorRole,
      personId: gated.ctx.actorPersonId,
    },
    resourceType: 'person',
    resourceId: personId,
    relationNeeded: ['editor', 'org_admin'],
  });
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.code }, { status: 403 });
  }

  const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const body = ignoreBodyOrganizationId(raw);

  try {
    const person = updatePerson(personId, {
      displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
      lifecycleStatus:
        body.lifecycleStatus === 'active' ||
        body.lifecycleStatus === 'inactive' ||
        body.lifecycleStatus === 'archived' ||
        body.lifecycleStatus === 'deceased'
          ? body.lifecycleStatus
          : undefined,
      deceasedAt:
        body.lifecycleStatus === 'deceased' ? new Date().toISOString() : undefined,
      dateOfBirth: typeof body.dateOfBirth === 'string' ? body.dateOfBirth : undefined,
      isMinor: typeof body.isMinor === 'boolean' ? body.isMinor : undefined,
    });
    appendPeopleAudit({
      organizationId: gated.ctx.organizationId,
      actorEmail: gated.ctx.session.email || 'unknown',
      action: 'people.update',
      subjectPersonId: personId,
    });
    return NextResponse.json({
      ok: true,
      person: redactPersonForActor(
        {
          email: gated.ctx.session.email,
          role: gated.ctx.actorRole,
          personId: gated.ctx.actorPersonId,
        },
        person,
        { relation: access.relation },
      ),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'update failed';
    if (message.includes('immutable')) {
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
