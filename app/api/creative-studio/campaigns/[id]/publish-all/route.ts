import { NextRequest, NextResponse } from 'next/server';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { publishAllCampaignAssets } from '@/lib/creative-studio/publish-asset';

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
  let body: { actorName?: string };
  try {
    body = (await req.json().catch(() => ({}))) as { actorName?: string };
  } catch {
    body = {};
  }

  const { campaign, results } = await publishAllCampaignAssets({
    campaignId: id,
    actorName: body.actorName,
  });

  if (!campaign) {
    return NextResponse.json({ ok: false, error: 'Campaign not found.' }, { status: 404 });
  }

  const ok = results.every((r) => r.result.ok);
  return NextResponse.json({ ok, campaign, results });
}
