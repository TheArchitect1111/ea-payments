import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { roleAtLeast } from '@/lib/rbac';
import { assertPeopleAccess, redactPersonForActor } from '@/lib/people/acl';
import { loadPeopleAclContextBatch } from '@/lib/people/acl-context';
import { guardPeopleApi, peopleErrorResponse } from '@/lib/people/guard';
import { orgEmailKey } from '@/lib/people/keys';
import { ignoreBodyOrganizationId } from '@/lib/people/resolve-tenant';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const gated = await guardPeopleApi(req, slug);
  if (!gated.ok) return gated.response;

  if (!roleAtLeast(gated.ctx.actorRole, 'staff')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const actor = {
    email: gated.ctx.session.email,
    role: gated.ctx.actorRole,
    personId: gated.ctx.actorPersonId,
  };

  try {
    const people = await gated.ctx.repository.listPersonsByOrg(gated.ctx.organizationId);
    const aclBatch = await loadPeopleAclContextBatch({
      organizationId: gated.ctx.organizationId,
      actorPersonId: gated.ctx.actorPersonId,
    });

    const redacted = [];
    for (const person of people) {
      // INV-22 — absorbed tombstones never appear in list results.
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
        actor,
        resourceType: 'person',
        resourceId: person.id,
        relationNeeded: ['viewer', 'self', 'guardian', 'org_admin'],
        context: await aclBatch.forPerson(person),
      });
      if (!access.ok) continue;
      redacted.push(redactPersonForActor(actor, person, { relation: access.relation }));
    }

    return NextResponse.json({ ok: true, people: redacted });
  } catch (error) {
    return peopleErrorResponse(error);
  }
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

  const actor = {
    email: gated.ctx.session.email,
    role: gated.ctx.actorRole,
    personId: gated.ctx.actorPersonId,
  };

  try {
    // ADV-P-1b — concurrent creates for the same email converge on one Person.
    const { person, created } = await gated.ctx.repository.upsertPersonByIdentity(
      {
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
      },
      { emailKey: email ? orgEmailKey(gated.ctx.organizationId, email) : undefined },
    );

    if (created) {
      await gated.ctx.repository.appendAudit({
        organizationId: gated.ctx.organizationId,
        actorEmail: gated.ctx.session.email || 'unknown',
        action: 'people.create',
        subjectPersonId: person.id,
      });
    }

    const access = await assertPeopleAccess({
      organizationId: gated.ctx.organizationId,
      portalSlug: gated.ctx.portalSlug,
      actor,
      resourceType: 'person',
      resourceId: person.id,
      relationNeeded: ['viewer', 'org_admin'],
      // A person created milliseconds ago owns no grants, consents, or edges.
      context: {
        person,
        grants: [],
        consents: [],
        relationships: [],
        actorDirectoryMembership: null,
      },
    });

    return NextResponse.json({
      ok: true,
      created,
      person: access.ok
        ? redactPersonForActor(actor, person, { relation: access.relation })
        : { id: person.id },
    });
  } catch (error) {
    return peopleErrorResponse(error);
  }
}
