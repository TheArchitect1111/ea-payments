import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { buildCtpAdminSubmissionView } from '@/lib/ctp-admin-view';
import { scheduleCtpReview } from '@/lib/ctp-review-schedule';

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

  let body: { reviewScheduledAt?: string };
  try {
    body = (await req.json()) as { reviewScheduledAt?: string };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const reviewScheduledAt = String(body.reviewScheduledAt ?? '').trim();
  if (!reviewScheduledAt) {
    return NextResponse.json({ ok: false, error: 'reviewScheduledAt required.' }, { status: 400 });
  }

  const result = await scheduleCtpReview(submissionId, reviewScheduledAt);
  if (!result.ok || !result.submission) {
    return NextResponse.json(
      { ok: false, error: result.error ?? 'Review scheduling failed.' },
      { status: result.error?.includes('not found') ? 404 : 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    submission: buildCtpAdminSubmissionView(result.submission),
  });
}
