import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { getCampaign } from '@/lib/creative-studio/campaign-store';
import { listLearningRecords, recordCampaignLearning } from '@/lib/creative-studio/exception-queue';

export const dynamic = 'force-dynamic';

const orgId = () => process.env.EA_INTERNAL_ORG_ID ?? 'ea';

export async function GET(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);
  const records = await listLearningRecords(orgId());
  return NextResponse.json({ ok: true, records });
}

export async function POST(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  const body = (await req.json().catch(() => ({}))) as { campaignId?: string };
  if (!body.campaignId) return NextResponse.json({ ok: false, error: 'campaignId required.' }, { status: 400 });

  const campaign = await getCampaign(body.campaignId);
  if (!campaign) return NextResponse.json({ ok: false, error: 'Campaign not found.' }, { status: 404 });

  const record = await recordCampaignLearning({ campaign });
  if (!record) {
    return NextResponse.json(
      { ok: false, error: 'Campaign has no analytics yet. Publish content and wait for engagement data first.' },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, record });
}
