import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { roleAtLeast } from '@/lib/rbac';
import { guardPeopleApi } from '@/lib/people/guard';
import { validateImportRow, type ImportRow } from '@/lib/people/import-export';
import {
  appendPeopleAudit,
  createPerson,
  upsertDirectoryMembership,
} from '@/lib/people/store';

type Ctx = { params: Promise<{ slug: string }> };

/** INV-17 — flag OFF must hard-404 even for unsupported methods (avoid bare 405). */
export async function GET(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const gated = await guardPeopleApi(req, slug);
  if (!gated.ok) return gated.response;
  return NextResponse.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const gated = await guardPeopleApi(req, slug);
  if (!gated.ok) return gated.response;

  if (!roleAtLeast(gated.ctx.actorRole, 'staff')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { rows?: ImportRow[] };
  const rows = Array.isArray(body.rows) ? body.rows.slice(0, 500) : [];
  const results: Array<{ ok: boolean; error?: string; personId?: string }> = [];

  for (const row of rows) {
    const validated = validateImportRow(row, gated.ctx.actorRole);
    if (!validated.ok) {
      results.push({ ok: false, error: validated.error });
      continue;
    }
    try {
      const person = createPerson({
        organizationId: gated.ctx.organizationId,
        portalSlug: gated.ctx.portalSlug,
        displayName: row.displayName,
        emails: row.email ? [{ value: row.email, kind: 'primary' }] : [],
        phones: row.phone ? [{ value: row.phone, kind: 'other' }] : [],
        lifecycleStatus: 'active',
        source: 'import',
        createdByUserEmail: gated.ctx.session.email,
      });
      upsertDirectoryMembership({
        organizationId: gated.ctx.organizationId,
        personId: person.id,
        roles: validated.roles,
        status: 'active',
      });
      results.push({ ok: true, personId: person.id });
    } catch (err) {
      results.push({
        ok: false,
        error: err instanceof Error ? err.message : 'import failed',
      });
    }
  }

  appendPeopleAudit({
    organizationId: gated.ctx.organizationId,
    actorEmail: gated.ctx.session.email || 'unknown',
    action: 'people.import',
    meta: { rows: rows.length },
  });

  return NextResponse.json({ ok: true, results });
}
