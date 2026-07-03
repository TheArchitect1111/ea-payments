import { NextResponse } from 'next/server';
import { guardPortalApiCookie, portalApiUnauthorized } from '@/lib/api/portal-route';
import { getCaptureByIdentifier } from '@/lib/capture-records';
import { parseOpportunityPayload } from '@/lib/opportunity-experience';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await guardPortalApiCookie({ realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const session = auth.session;

  const { id } = await params;
  const record = await getCaptureByIdentifier(id);
  if (!record) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  if (record.portalSlug && record.portalSlug !== session.slug) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const payload = parseOpportunityPayload(record);
  const intelligence = payload?.intelligence;
  if (!intelligence) {
    return NextResponse.json(
      { ok: false, error: 'Intelligence not available for this capture. Re-analyze to generate.' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    recordId: record.id,
    intelligence,
    cursorPrompt: intelligence.build.cursorPrompt,
  });
}
