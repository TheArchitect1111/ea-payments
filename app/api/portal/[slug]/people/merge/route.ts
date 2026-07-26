import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { guardPeopleApi } from '@/lib/people/guard';
import { mergePersons } from '@/lib/people/merge';

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

  const body = (await req.json().catch(() => ({}))) as {
    survivorPersonId?: string;
    absorbedPersonId?: string;
    organizationId?: string;
  };

  const result = mergePersons({
    sessionOrganizationId: gated.ctx.organizationId,
    survivorPersonId: String(body.survivorPersonId || ''),
    absorbedPersonId: String(body.absorbedPersonId || ''),
    actorEmail: gated.ctx.session.email || 'unknown',
    actorRole: gated.ctx.actorRole,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, survivorId: result.survivorId });
}
