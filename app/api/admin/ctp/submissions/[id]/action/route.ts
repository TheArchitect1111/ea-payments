import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { buildCtpAdminSubmissionView } from '@/lib/ctp-admin-view';
import {
  runCtpExecutiveAction,
  type CtpExecutiveAction,
} from '@/lib/ctp-executive-actions';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

const ACTIONS = new Set<CtpExecutiveAction>([
  'ready_for_review',
  'approve_reveal',
  'run_production',
  'run_digital_audit',
  'run_open_design_handoff',
  'resend_executive_email',
  'reprovision_workspace',
]);

export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  const { id } = await context.params;
  const submissionId = decodeURIComponent(id).trim();
  if (!submissionId) {
    return NextResponse.json({ ok: false, error: 'Submission ID required.' }, { status: 400 });
  }

  let body: { action?: string };
  try {
    body = (await req.json()) as { action?: string };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const action = String(body.action ?? '').trim() as CtpExecutiveAction;
  if (!ACTIONS.has(action)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'action must be ready_for_review, approve_reveal, run_production, run_digital_audit, run_open_design_handoff, resend_executive_email, or reprovision_workspace.',
      },
      { status: 400 },
    );
  }

  const result = await runCtpExecutiveAction(submissionId, action);
  if (!result.ok || !result.submission) {
    return NextResponse.json(
      { ok: false, error: result.error ?? 'Action failed.' },
      { status: result.error?.includes('not found') ? 404 : 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    action,
    revealUrl: result.revealUrl,
    handoffUrl: result.handoffUrl,
    handoff: result.handoff,
    submission: buildCtpAdminSubmissionView(result.submission),
  });
}
