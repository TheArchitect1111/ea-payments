import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { buildCtpAdminSubmissionView } from '@/lib/ctp-admin-view';
import { getCtpSubmissionById } from '@/lib/ctp-submissions';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  const { id } = await context.params;
  const submissionId = decodeURIComponent(id).trim();
  if (!submissionId) {
    return NextResponse.json({ ok: false, error: 'Submission ID required.' }, { status: 400 });
  }

  const submission = await getCtpSubmissionById(submissionId);
  if (!submission) {
    return NextResponse.json({ ok: false, error: 'CTP submission not found.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, submission: buildCtpAdminSubmissionView(submission) });
}
