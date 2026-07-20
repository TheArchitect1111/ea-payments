/**
 * Website + Portal → CTP workspace bind (Option A).
 *
 * Portal + site are already provisioned by fulfillPaidClient.
 * This creates/reuses a CTP submission and links it to the existing portal
 * using the same active-portal outcome as ctp-workspace-provision —
 * without re-creating portals/sites or re-running production schedules.
 */
import {
  createCtpSubmission,
  getCtpSubmissionByProposalId,
  getCtpSubmissionForPortal,
  updateCtpSubmission,
  type CtpSubmission,
} from '@/lib/ctp-submissions';
import { emitPulseEvent } from '@/lib/pulse-bus';
import { publicPortalUrl } from '@/lib/ctp-portal-host';

export function websitePortalWorkspaceProposalId(portalSlug: string): string {
  return `WPS-${portalSlug.trim().toLowerCase()}`;
}

export function websitePortalWorkspaceAssessmentId(portalSlug: string): string {
  return `WPS-ASSESS-${portalSlug.trim().toLowerCase()}`;
}

function isLinkedActive(submission: CtpSubmission, portalSlug: string): boolean {
  return (
    submission.portalSlug === portalSlug &&
    submission.workspaceStatus === 'Active' &&
    (submission.status === 'Workspace Active' ||
      submission.status === 'Studio In Progress' ||
      submission.status === 'Ready For Review' ||
      submission.status === 'Review Scheduled' ||
      submission.status === 'Completed')
  );
}

async function linkSubmissionToPortal(
  submission: CtpSubmission,
  portalSlug: string,
  siteUrl?: string,
): Promise<CtpSubmission> {
  if (isLinkedActive(submission, portalSlug) && (!siteUrl || submission.siteUrl === siteUrl)) {
    return submission;
  }

  const result = await updateCtpSubmission(submission.id, {
    portalSlug,
    workspaceStatus: 'Active',
    status: 'Workspace Active',
    clientType: 'website_portal',
    ...(siteUrl ? { siteUrl } : {}),
  });

  const linked = result.submission ?? {
    ...submission,
    portalSlug,
    workspaceStatus: 'Active' as const,
    status: 'Workspace Active' as const,
    clientType: 'website_portal' as const,
    siteUrl: siteUrl ?? submission.siteUrl,
  };

  if (!isLinkedActive(submission, portalSlug)) {
    try {
      await emitPulseEvent({
        product: 'ea-platform',
        type: 'ctp.workspace.active',
        title: `CTP workspace active — ${linked.businessName}`,
        detail: `Website + Portal linked at ${publicPortalUrl(portalSlug)}`,
        priority: 'medium',
        href: '/admin/master',
        tenantId: portalSlug,
        objectId: linked.id,
        metadata: {
          ctpSubmissionId: linked.id,
          email: linked.email,
          portalSlug,
          source: 'website-portal-fulfill',
        },
      });
    } catch (err) {
      console.error('[ctp-website-portal-workspace] pulse failed:', err);
    }
  }

  return linked;
}

/**
 * Idempotent: one CTP submission per Website + Portal slug (proposal id WPS-{slug}).
 * Never creates a second portal or website.
 */
export async function ensureCtpWorkspaceForWebsitePortal(input: {
  portalSlug: string;
  email: string;
  clientName: string;
  organization?: string;
  siteUrl?: string;
}): Promise<{ ok: boolean; submission?: CtpSubmission; reused: boolean; error?: string }> {
  const portalSlug = input.portalSlug.trim();
  const email = input.email.trim().toLowerCase();
  if (!portalSlug || !email) {
    return { ok: false, reused: false, error: 'portalSlug and email required.' };
  }

  const proposalId = websitePortalWorkspaceProposalId(portalSlug);
  const assessmentId = websitePortalWorkspaceAssessmentId(portalSlug);

  const byPortal = await getCtpSubmissionForPortal({ portalSlug, email });
  if (byPortal) {
    const linked = await linkSubmissionToPortal(byPortal, portalSlug, input.siteUrl);
    return { ok: true, submission: linked, reused: true };
  }

  const byProposal = await getCtpSubmissionByProposalId(proposalId);
  if (byProposal) {
    const linked = await linkSubmissionToPortal(byProposal, portalSlug, input.siteUrl);
    return { ok: true, submission: linked, reused: true };
  }

  const created = await createCtpSubmission({
    businessName: (input.organization || input.clientName).trim() || input.clientName,
    contactName: input.clientName.trim() || email,
    email,
    assessmentId,
    proposalId,
    portalRequired: true,
    clientType: 'website_portal',
    discoveryAnswers: {
      source: 'website_portal_starter',
      provisionedVia: 'fulfillPaidClient',
    },
  });

  if (!created.ok || !created.submission) {
    return {
      ok: false,
      reused: false,
      error: created.error || 'Could not create CTP submission.',
    };
  }

  const linked = await linkSubmissionToPortal(created.submission, portalSlug, input.siteUrl);
  return { ok: true, submission: linked, reused: false };
}
