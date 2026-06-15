import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { updateProposal, getProposalByRecordId } from '@/lib/airtable';
import { sendProposalEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

type ProposalAction = 'approve' | 'reject' | 'discovery' | 'update_fee' | 'update_scope';

interface PatchBody {
  action: ProposalAction;
  recommendedFee?: number;
  scopeSummary?: string;
}

const VALID_ACTIONS: ProposalAction[] = [
  'approve',
  'reject',
  'discovery',
  'update_fee',
  'update_scope',
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Record ID required.' }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!body.action || !VALID_ACTIONS.includes(body.action)) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
      { status: 400 }
    );
  }

  let patch: Parameters<typeof updateProposal>[1] = {};

  switch (body.action) {
    case 'approve':
      patch = {
        status: 'Approved',
        dateApproved: new Date().toISOString().slice(0, 10),
      };
      break;

    case 'reject':
      patch = { status: 'Rejected' };
      break;

    case 'discovery':
      patch = { status: 'Discovery Call Requested' };
      break;

    case 'update_fee': {
      const fee = Number(body.recommendedFee);
      if (!Number.isFinite(fee) || fee < 0) {
        return NextResponse.json({ error: 'Invalid fee value.' }, { status: 400 });
      }
      patch = { recommendedFee: fee };
      break;
    }

    case 'update_scope':
      if (typeof body.scopeSummary !== 'string') {
        return NextResponse.json({ error: 'scopeSummary must be a string.' }, { status: 400 });
      }
      patch = { scopeSummary: body.scopeSummary };
      break;
  }

  const result = await updateProposal(id, patch);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Update failed.' }, { status: 500 });
  }

  // After approving: fetch the full proposal and send the prospect email.
  // Status is already set to Approved; email failure does not roll back the status.
  if (body.action === 'approve') {
    let emailWarning: string | undefined;
    try {
      const fullProposal = await getProposalByRecordId(id);
      if (fullProposal) {
        const emailResult = await sendProposalEmail(fullProposal);
        if (!emailResult.ok) {
          emailWarning = emailResult.error;
          console.error('sendProposalEmail failed:', emailWarning);
        }
      } else {
        emailWarning = 'Proposal approved but could not be fetched for email delivery.';
        console.error(emailWarning);
      }
    } catch (err) {
      emailWarning = err instanceof Error ? err.message : 'Email error.';
      console.error('sendProposalEmail error:', err);
    }
    return NextResponse.json({ ok: true, emailWarning });
  }

  return NextResponse.json({ ok: true });
}
