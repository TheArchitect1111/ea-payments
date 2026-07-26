import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { roleAtLeast } from '@/lib/rbac';
import { assertPeopleAccess, personToExportRow } from '@/lib/people/acl';
import { guardPeopleApi } from '@/lib/people/guard';
import { appendPeopleAudit, listPersonsByOrg } from '@/lib/people/store';

type Ctx = { params: Promise<{ slug: string }> };

/** INV-14 — export uses same redaction as GET. */
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

  const rows = [];
  for (const person of listPersonsByOrg(gated.ctx.organizationId)) {
    if (person.mergedIntoPersonId) continue;
    const access = await assertPeopleAccess({
      organizationId: gated.ctx.organizationId,
      portalSlug: gated.ctx.portalSlug,
      actor,
      resourceType: 'person',
      resourceId: person.id,
      relationNeeded: ['viewer', 'org_admin'],
    });
    if (!access.ok) continue;
    rows.push(personToExportRow(actor, person, { relation: access.relation }));
  }

  appendPeopleAudit({
    organizationId: gated.ctx.organizationId,
    actorEmail: gated.ctx.session.email || 'unknown',
    action: 'people.export',
    meta: { count: rows.length },
  });

  const header = 'id,displayName,email,dateOfBirth,lifecycleStatus';
  const csv = [
    header,
    ...rows.map((r) =>
      [r.id, r.displayName, r.email, r.dateOfBirth, r.lifecycleStatus]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(','),
    ),
  ].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="people-export.csv"',
    },
  });
}
