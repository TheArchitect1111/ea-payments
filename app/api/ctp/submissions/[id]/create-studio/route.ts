import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { runCtpStudioCampaign } from '@/lib/ctp-studio-bridge';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  const { id } = await context.params;
  const submissionId = decodeURIComponent(id).trim();
  if (!submissionId) {
    return NextResponse.json({ ok: false, error: 'Submission ID required.' }, { status: 400 });
  }

  const result = await runCtpStudioCampaign(submissionId);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? 'Studio campaign creation failed.' },
      { status: result.error?.includes('not found') ? 404 : 502 },
    );
  }

  return NextResponse.json({ ok: true, campaignId: result.campaignId });
}
