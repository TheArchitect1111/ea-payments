import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { roleAtLeast } from '@/lib/rbac';
import { assertPeopleAccess, redactPersonForActor } from '@/lib/people/acl';
import { guardPeopleApi } from '@/lib/people/guard';
import { ignoreBodyOrganizationId } from '@/lib/people/resolve-tenant';
import {
  appendPeopleAudit,
  createPerson,
  listPersonsByOrg,
} from '@/lib/people/store';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const gated = await guardPeopleApi(req, slug);
  if (!gated.ok) return gated.response;

  if (!roleAtLeast(gated.ctx.actorRole, 'staff')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const people = listPersonsByOrg(gated.ctx.organizationId).filter(
    (p) =>
      p.lifecycleStatus === 'active' ||
      p.lifecycleStatus === 'inactive' ||
      roleAtLeast(gated.ctx.actorRole, 'admin'),
  );

  const redacted = [];
  for (const person of people) {
    if (person.mergedIntoPersonId) continue;
    if (
      (person.lifecycleStatus === 'archived' || person.lifecycleStatus === 'deceased') &&
      !roleAtLeast(gated.ctx.actorRole, 'admin')
    ) {
      continue;
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
      resourceId: person.id,
      relationNeeded: ['viewer', 'self', 'guardian', 'org_admin'],
    });
    if (!access.ok) continue;
    redacted.push(
      redactPersonForActor(
        {
          email: gated.ctx.session.email,
          role: gated.ctx.actorRole,
          personId: gated.ctx.actorPersonId,
        },
        person,
        { relation: access.relation },
      ),
    );
  }

  return NextResponse.json({ ok: true, people: redacted });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const gated = await guardPeopleApi(req, slug);
  if (!gated.ok) return gated.response;

  if (!roleAtLeast(gated.ctx.actorRole, 'staff')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  // INV-1 / ADV-1 — ignore body organizationId
  const body = ignoreBodyOrganizationId(raw);

  const displayName = String(body.displayName || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  if (!displayName) {
    return NextResponse.json({ ok: false, error: 'displayName required' }, { status: 400 });
  }

  const person = createPerson({
    organizationId: gated.ctx.organizationId,
    portalSlug: gated.ctx.portalSlug,
    displayName,
    emails: email ? [{ value: email, kind: 'primary' }] : [],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
    createdByUserEmail: gated.ctx.session.email,
    dateOfBirth: typeof body.dateOfBirth === 'string' ? body.dateOfBirth : undefined,
    isMinor: typeof body.isMinor === 'boolean' ? body.isMinor : undefined,
  });

  appendPeopleAudit({
    organizationId: gated.ctx.organizationId,
    actorEmail: gated.ctx.session.email || 'unknown',
    action: 'people.create',
    subjectPersonId: person.id,
  });

  const access = await assertPeopleAccess({
    organizationId: gated.ctx.organizationId,
    portalSlug: gated.ctx.portalSlug,
    actor: {
      email: gated.ctx.session.email,
      role: gated.ctx.actorRole,
      personId: gated.ctx.actorPersonId,
    },
    resourceType: 'person',
    resourceId: person.id,
    relationNeeded: ['viewer', 'org_admin'],
  });

  return NextResponse.json({
    ok: true,
    person: access.ok
      ? redactPersonForActor(
          {
            email: gated.ctx.session.email,
            role: gated.ctx.actorRole,
            personId: gated.ctx.actorPersonId,
          },
          person,
          { relation: access.relation },
        )
      : { id: person.id },
  });
}
