import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { publishAllCampaignAssets } from '@/lib/creative-studio/publish-asset';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  const { id } = await params;
  let body: { actorName?: string };
  try {
    body = (await req.json().catch(() => ({}))) as { actorName?: string };
  } catch {
    body = {};
  }

  const { campaign, results } = await publishAllCampaignAssets({
    campaignId: id,
    actorName: body.actorName ?? auth.user.name,
  });

  if (!campaign) {
    return NextResponse.json({ ok: false, error: 'Campaign not found.' }, { status: 404 });
  }

  const ok = results.every((r) => r.result.ok);
  return NextResponse.json({ ok, campaign, results });
}
