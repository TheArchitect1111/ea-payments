import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { buildCtpAdminSubmissionView } from '@/lib/ctp-admin-view';
import { getCtpSubmissionByProposalId, listCtpSubmissions } from '@/lib/ctp-submissions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  const proposalId = req.nextUrl.searchParams.get('proposalId')?.trim();
  if (proposalId) {
    const submission = await getCtpSubmissionByProposalId(proposalId);
    if (!submission) {
      return NextResponse.json({ ok: true, submission: null });
    }
    return NextResponse.json({ ok: true, submission: buildCtpAdminSubmissionView(submission) });
  }

  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 100) || 100, 200);
  const submissions = await listCtpSubmissions(limit);
  return NextResponse.json({
    ok: true,
    submissions: submissions.map(buildCtpAdminSubmissionView),
  });
}
