import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { publishCampaignAsset } from '@/lib/creative-studio/publish-asset';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  const { id } = await params;
  let body: { assetId?: string; actorName?: string };
  try {
    body = (await req.json()) as { assetId?: string; actorName?: string };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.assetId) {
    return NextResponse.json({ ok: false, error: 'assetId is required.' }, { status: 400 });
  }

  const { campaign, result } = await publishCampaignAsset({
    campaignId: id,
    assetId: body.assetId,
    actorName: body.actorName ?? auth.user.name,
  });

  if (!campaign) {
    return NextResponse.json({ ok: false, error: 'Campaign not found.' }, { status: 404 });
  }

  return NextResponse.json({ ok: result.ok, campaign, publish: result });
}
