import { NextRequest, NextResponse } from 'next/server';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { publishCampaignAsset } from '@/lib/creative-studio/publish-asset';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ ok: false, error: 'Admin sign-in required.' }, { status: 401 });
  }

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
    actorName: body.actorName,
  });

  if (!campaign) {
    return NextResponse.json({ ok: false, error: 'Campaign not found.' }, { status: 404 });
  }

  return NextResponse.json({ ok: result.ok, campaign, publish: result });
}
