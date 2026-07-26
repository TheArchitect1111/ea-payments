import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { roleAtLeast } from '@/lib/rbac';
import { assertPeopleAccess, redactPersonForActor } from '@/lib/people/acl';
import { loadPeopleAclContext } from '@/lib/people/acl-context';
import { guardPeopleApi, peopleErrorResponse } from '@/lib/people/guard';
import { ignoreBodyOrganizationId } from '@/lib/people/resolve-tenant';

type Ctx = { params: Promise<{ slug: string; personId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { slug, personId } = await ctx.params;
  const gated = await guardPeopleApi(req, slug);
  if (!gated.ok) return gated.response;

  const actor = {
    email: gated.ctx.session.email,
    role: gated.ctx.actorRole,
    personId: gated.ctx.actorPersonId,
  };

  try {
    const context = await loadPeopleAclContext({
      organizationId: gated.ctx.organizationId,
      personId,
      actorPersonId: gated.ctx.actorPersonId,
    });
    const person = context.person;
    if (!person || person.organizationId !== gated.ctx.organizationId) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    // INV-22 — absorbed ids resolve to the survivor, but only under the actor's ACL.
    if (person.mergedIntoPersonId) {
      const survivorContext = await loadPeopleAclContext({
        organizationId: gated.ctx.organizationId,
        personId: person.mergedIntoPersonId,
        actorPersonId: gated.ctx.actorPersonId,
      });
      const survivor = survivorContext.person;
      if (!survivor || survivor.organizationId !== gated.ctx.organizationId) {
        return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
      }
      const survivorAccess = await assertPeopleAccess({
        organizationId: gated.ctx.organizationId,
        portalSlug: gated.ctx.portalSlug,
        actor,
        resourceType: 'person',
        resourceId: survivor.id,
        relationNeeded: ['viewer', 'self', 'guardian', 'org_admin', 'editor'],
        context: survivorContext,
      });
      // Do not leak the existence of the survivor across an ACL boundary.
      if (!survivorAccess.ok) {
        return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
      }
      return NextResponse.json({
        ok: true,
        redirectedTo: survivor.id,
        mergedFrom: person.id,
        person: redactPersonForActor(actor, survivor, { relation: survivorAccess.relation }),
      });
    }

    const access = await assertPeopleAccess({
      organizationId: gated.ctx.organizationId,
      portalSlug: gated.ctx.portalSlug,
      actor,
      resourceType: 'person',
      resourceId: personId,
      relationNeeded: ['viewer', 'self', 'guardian', 'org_admin', 'editor'],
      context,
    });

    if (!access.ok) {
      const status = access.code === 'not_found' ? 404 : 403;
      return NextResponse.json({ ok: false, error: access.code }, { status });
    }

    return NextResponse.json({
      ok: true,
      person: redactPersonForActor(actor, person, { relation: access.relation }),
    });
  } catch (error) {
    return peopleErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { slug, personId } = await ctx.params;
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

  const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const body = ignoreBodyOrganizationId(raw);

  try {
    const context = await loadPeopleAclContext({
      organizationId: gated.ctx.organizationId,
      personId,
      actorPersonId: gated.ctx.actorPersonId,
    });
    if (!context.person || context.person.organizationId !== gated.ctx.organizationId) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    const access = await assertPeopleAccess({
      organizationId: gated.ctx.organizationId,
      portalSlug: gated.ctx.portalSlug,
      actor,
      resourceType: 'person',
      resourceId: personId,
      relationNeeded: ['editor', 'org_admin'],
      context,
    });
    if (!access.ok) {
      return NextResponse.json({ ok: false, error: access.code }, { status: 403 });
    }

    // INV-23 — clients send the `Updated At` they read; a mismatch is a 409.
    const expectedUpdatedAt =
      req.headers.get('if-unmodified-since') ||
      (typeof body.expectedUpdatedAt === 'string' ? body.expectedUpdatedAt : undefined) ||
      undefined;

    const person = await gated.ctx.repository.updatePerson(
      personId,
      {
        displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
        lifecycleStatus:
          body.lifecycleStatus === 'active' ||
          body.lifecycleStatus === 'inactive' ||
          body.lifecycleStatus === 'archived' ||
          body.lifecycleStatus === 'deceased'
            ? body.lifecycleStatus
            : undefined,
        deceasedAt: body.lifecycleStatus === 'deceased' ? new Date().toISOString() : undefined,
        dateOfBirth: typeof body.dateOfBirth === 'string' ? body.dateOfBirth : undefined,
        isMinor: typeof body.isMinor === 'boolean' ? body.isMinor : undefined,
      },
      { expectedUpdatedAt },
    );

    await gated.ctx.repository.appendAudit({
      organizationId: gated.ctx.organizationId,
      actorEmail: gated.ctx.session.email || 'unknown',
      action: 'people.update',
      subjectPersonId: personId,
    });

    return NextResponse.json({
      ok: true,
      person: redactPersonForActor(actor, person, { relation: access.relation }),
    });
  } catch (error) {
    return peopleErrorResponse(error);
  }
}
