/**
 * CTP admin commercial join — proposal status + paid visibility + send proposal.
 */
import {
  getClientByEmail,
  getProposalByProposalId,
  updateProposal,
  type ProposalWithAssessment,
} from '@/lib/airtable';
import type { CtpAdminSubmissionView } from '@/lib/ctp-admin-view';
import { buildCtpAdminSubmissionView } from '@/lib/ctp-admin-view';
import { sendProposalEmail } from '@/lib/email';
import { emitPulseEvent } from '@/lib/pulse-bus';
import {
  getCtpSubmissionById,
  type CtpSubmission,
} from '@/lib/ctp-submissions';

export type CtpCommercialStatus = {
  proposalRecordId?: string;
  proposalStatus?: string;
  paymentStatus?: string;
  recommendedFee?: number;
  paid: boolean;
  amountPaid?: number;
  portalAccessStatus?: string;
  commercialLabel: string;
};

function isPaidStatus(status?: string, paymentStatus?: string, amountPaid?: number): boolean {
  const s = (status || '').toLowerCase();
  const p = (paymentStatus || '').toLowerCase();
  if (amountPaid && amountPaid > 0) return true;
  if (s.includes('paid') || p.includes('paid')) return true;
  if (s === 'approved & paid') return true;
  return false;
}

export async function resolveCtpCommercialStatus(
  submission: CtpSubmission,
): Promise<CtpCommercialStatus> {
  let proposal: ProposalWithAssessment | null = null;
  if (submission.proposalId?.trim()) {
    try {
      proposal = await getProposalByProposalId(submission.proposalId.trim());
    } catch {
      proposal = null;
    }
  }

  let amountPaid: number | undefined;
  let portalAccessStatus: string | undefined;
  try {
    const client = await getClientByEmail(submission.email);
    if (client) {
      amountPaid = client.amountPaid;
      portalAccessStatus = client.portalAccessStatus;
    }
  } catch {
    // best-effort
  }

  const paid = isPaidStatus(proposal?.status, proposal?.paymentStatus, amountPaid);
  let commercialLabel = 'No proposal';
  if (proposal) {
    if (paid) commercialLabel = 'Paid';
    else if ((proposal.status || '').toLowerCase().includes('approved')) {
      commercialLabel = 'Proposal sent — awaiting payment';
    } else {
      commercialLabel = proposal.status || 'Proposal draft';
    }
  } else if (paid) {
    commercialLabel = 'Paid (client record)';
  }

  return {
    proposalRecordId: proposal?.id,
    proposalStatus: proposal?.status,
    paymentStatus: proposal?.paymentStatus,
    recommendedFee: proposal?.recommendedFee,
    paid,
    amountPaid,
    portalAccessStatus,
    commercialLabel,
  };
}

export async function enrichCtpAdminViewWithCommercial(
  submission: CtpSubmission,
): Promise<CtpAdminSubmissionView> {
  const base = buildCtpAdminSubmissionView(submission);
  const commercial = await resolveCtpCommercialStatus(submission);
  return {
    ...base,
    proposalRecordId: commercial.proposalRecordId,
    proposalStatus: commercial.proposalStatus,
    paymentStatus: commercial.paymentStatus,
    recommendedFee: commercial.recommendedFee,
    paid: commercial.paid,
    amountPaid: commercial.amountPaid,
    portalAccessStatus: commercial.portalAccessStatus,
    commercialLabel: commercial.commercialLabel,
  };
}

export async function sendCtpProposalFromDesk(submissionId: string): Promise<{
  ok: boolean;
  submission?: CtpSubmission;
  view?: CtpAdminSubmissionView;
  emailWarning?: string;
  error?: string;
}> {
  const submission = await getCtpSubmissionById(submissionId);
  if (!submission) return { ok: false, error: 'CTP submission not found.' };
  if (!submission.proposalId?.trim()) {
    return { ok: false, error: 'No proposal linked to this CTP submission.' };
  }

  const proposal = await getProposalByProposalId(submission.proposalId.trim());
  if (!proposal?.id) {
    return { ok: false, error: `Proposal ${submission.proposalId} not found.` };
  }

  const updated = await updateProposal(proposal.id, {
    status: 'Approved',
    dateApproved: new Date().toISOString().slice(0, 10),
  });
  if (!updated.ok) {
    return { ok: false, error: updated.error ?? 'Could not approve proposal.' };
  }

  let emailWarning: string | undefined;
  const full = await getProposalByProposalId(submission.proposalId.trim());
  if (full) {
    const emailResult = await sendProposalEmail(full);
    if (!emailResult.ok) {
      emailWarning = emailResult.error;
    }
    try {
      await emitPulseEvent({
        product: 'ea-platform',
        type: 'proposal.approved',
        title: `Proposal approved — ${full.businessName}`,
        detail: `${submission.id} · CTP desk`,
        priority: 'high',
        href: '/admin/ctp',
        objectId: full.id,
        metadata: {
          proposalRecordId: full.id,
          ctpSubmissionId: submission.id,
          email: full.email,
        },
      });
    } catch {
      // non-fatal
    }
  } else {
    emailWarning = 'Proposal approved but could not be re-fetched for email.';
  }

  const view = await enrichCtpAdminViewWithCommercial(submission);
  return {
    ok: true,
    submission,
    view: {
      ...view,
      proposalStatus: 'Approved',
      commercialLabel: view.paid ? 'Paid' : 'Proposal sent — awaiting payment',
    },
    emailWarning,
  };
}
