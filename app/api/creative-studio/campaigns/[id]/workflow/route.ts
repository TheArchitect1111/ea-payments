import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import {
  applyCampaignWorkflow,
  type WorkflowAction,
} from '@/lib/creative-studio/campaign-workflow';

export const dynamic = 'force-dynamic';

const ACTIONS = new Set<WorkflowAction>([
  'submit-review',
  'approve',
  'reject',
  'schedule',
  'cancel-schedule',
  'pause-campaign',
  'resume-campaign',
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  let body: {
    action?: WorkflowAction;
    assetId?: string;
    note?: string;
    publishAt?: string;
    timezone?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.action || !ACTIONS.has(body.action)) {
    return NextResponse.json({ ok: false, error: 'Invalid workflow action.' }, { status: 400 });
  }

  const { id } = await params;
  const result = await applyCampaignWorkflow({
    campaignId: id,
    assetId: body.assetId,
    action: body.action,
    actor: auth.user.name,
    note: body.note,
    publishAt: body.publishAt,
    timezone: body.timezone,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
