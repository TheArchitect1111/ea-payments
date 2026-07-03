import { NextResponse } from 'next/server';
import { guardPortalApiCookie, portalApiUnauthorized } from '@/lib/api/portal-route';
import { getCaptureByIdentifier } from '@/lib/capture-records';
import { buildAmplifiSocialDraft } from '@/lib/amplifi-draft';
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

  const considerUrl = record.shareUrl;
  if (!considerUrl) {
    return NextResponse.json({ ok: false, error: 'Story not ready yet.' }, { status: 400 });
  }

  const payload = parseOpportunityPayload(record);
  const quickWin = payload?.magnifi.quickWins?.[0];

  const draft = buildAmplifiSocialDraft({
    businessName: record.businessName ?? record.title,
    considerUrl,
    quickWin,
    headline: record.analysisSummary?.split('\n')[0],
    prospectName: record.prospectName,
  });

  return NextResponse.json({ ok: true, draft, recordId: record.id });
}
