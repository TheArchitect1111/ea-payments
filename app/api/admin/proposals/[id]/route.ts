import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { updateProposal, getProposalByRecordId, getClientByEmail, updateClientLifecycleByEmail } from '@/lib/airtable';
import { sendInternalNotification, sendProposalEmail, sendRevealEmail } from '@/lib/email';
import { lifecycleForDiscoveryScheduled } from '@/lib/client-lifecycle';

export const dynamic = 'force-dynamic';

type ProposalAction = 'approve' | 'reject' | 'discovery' | 'update_fee' | 'update_scope' | 'mark_complete' | 'send_reveal';

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
  'mark_complete',
  'send_reveal',
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

    case 'mark_complete':
      patch = { status: 'Complete' };
      break;

    case 'send_reveal':
      patch = { status: 'Complete' };
      break;
  }

  const result = await updateProposal(id, patch);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Update failed.' }, { status: 500 });
  }

  if (body.action === 'discovery') {
    try {
      const proposal = await getProposalByRecordId(id);
      if (proposal?.email) {
        await updateClientLifecycleByEmail(proposal.email, lifecycleForDiscoveryScheduled());
      }
    } catch (err) {
      console.error('Discovery lifecycle update failed:', err);
    }
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

  if (body.action === 'mark_complete') {
    const proposal = await getProposalByRecordId(id);
    await sendInternalNotification({
      subject: `Project complete for ${proposal?.businessName ?? id}`,
      title: 'Project Complete',
      body: `Project complete for ${proposal?.contactName ?? 'client'}. Review and approve the reveal email before it sends.`,
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'send_reveal') {
    const proposal = await getProposalByRecordId(id);
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found.' }, { status: 404 });
    }
    const baseUrl = process.env.REVEAL_BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ea-payments.vercel.app';
    const client = await getClientByEmail(proposal.email);
    const slug = client?.portalSlug || proposal.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await sendRevealEmail({
      email: proposal.email,
      firstName: proposal.contactName.split(' ')[0] || proposal.contactName,
      projectType: proposal.projectTypeLabel || proposal.recommendedProjectType || 'Custom Solution',
      deliverables: [
        proposal.projectTypeLabel || proposal.recommendedProjectType || 'Custom Solution',
        'Client portal access',
        'Training and launch support',
      ],
      weeklyTimeRecovery: proposal.weeklyTimeRecovery,
      annualCapacityUnlocked: proposal.opportunityHigh,
      systemsAutomated: 1,
      revealUrl: `${baseUrl}/reveal/${slug}`,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
