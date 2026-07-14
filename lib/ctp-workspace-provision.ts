import { getClientByEmail } from '@/lib/airtable';
import { sendWelcomeEmail } from '@/lib/email';
import { ensurePackageEntitlements } from '@/lib/modules/portal-modules';
import { ensureOrganizationForPortal } from '@/lib/organizations';
import { createPortalAccess } from '@/lib/portal-access';
import type { PortalConfig } from '@/lib/catalog';
import { scheduleCtpStudioCampaign } from '@/lib/ctp-studio-bridge';
import { scheduleCtpWebsiteProvision } from '@/lib/ctp-website-provision';
import {
  getCtpSubmissionById,
  updateCtpSubmission,
  type CtpSubmission,
} from '@/lib/ctp-submissions';
import { emitPulseEvent } from '@/lib/pulse-bus';

const EA_PORTAL_CONFIG: PortalConfig = {
  platform: 'efficiency-architects',
  loginPath: '/portal/login',
};

const CTP_WELCOME_PACKAGE = 'Consider The Possibilities™';

function portalLoginUrl(): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ea-payments.vercel.app';
  return `${base}/portal/login`;
}

async function emitWorkspacePulse(
  submission: CtpSubmission,
  type: 'ctp.workspace.provisioning' | 'ctp.workspace.active' | 'ctp.workspace.failed',
  detail: string,
  priority: 'medium' | 'high' | 'critical' = 'medium',
): Promise<void> {
  await emitPulseEvent({
    product: 'ea-platform',
    type,
    title:
      type === 'ctp.workspace.active'
        ? `CTP workspace active — ${submission.businessName}`
        : type === 'ctp.workspace.failed'
          ? `CTP workspace failed — ${submission.businessName}`
          : `CTP workspace provisioning — ${submission.businessName}`,
    detail,
    priority,
    href: '/admin/master',
    tenantId: submission.considerSlug,
    objectId: submission.id,
    metadata: {
      ctpSubmissionId: submission.id,
      email: submission.email,
      assessmentId: submission.assessmentId,
      portalSlug: submission.portalSlug ?? '',
    },
  });
}

async function markWorkspaceActive(
  submission: CtpSubmission,
  portalSlug: string,
): Promise<void> {
  await updateCtpSubmission(submission.id, {
    portalSlug,
    workspaceStatus: 'Active',
    status: 'Workspace Active',
  });
  await emitWorkspacePulse(
    { ...submission, portalSlug },
    'ctp.workspace.active',
    `Portal ready at /portal/${portalSlug}`,
  );
  scheduleCtpStudioCampaign(submission.id);
  scheduleCtpWebsiteProvision(submission.id);
}

export async function runCtpWorkspaceProvision(
  submissionId: string,
): Promise<{ ok: boolean; error?: string; portalSlug?: string }> {
  const submission = await getCtpSubmissionById(submissionId);
  if (!submission) {
    return { ok: false, error: 'CTP submission not found.' };
  }

  if (submission.workspaceStatus === 'Active') {
    return { ok: true, portalSlug: submission.portalSlug };
  }

  if (submission.workspaceStatus === 'Provisioning') {
    return { ok: false, error: 'Workspace provisioning already in progress.' };
  }

  if (submission.workspaceStatus !== 'Pending' && submission.workspaceStatus !== 'Failed') {
    return { ok: false, error: `Cannot provision from workspace status ${submission.workspaceStatus}.` };
  }

  const client = await getClientByEmail(submission.email);
  if (!client?.id) {
    await updateCtpSubmission(submissionId, { workspaceStatus: 'Failed' });
    await emitWorkspacePulse(
      submission,
      'ctp.workspace.failed',
      'No Client Records row found for prospect email.',
      'high',
    );
    return { ok: false, error: 'No client record found for this email.' };
  }

  if (client.portalSlug && client.portalAccessStatus === 'Active') {
    await markWorkspaceActive(submission, client.portalSlug);
    return { ok: true, portalSlug: client.portalSlug };
  }

  await updateCtpSubmission(submissionId, { workspaceStatus: 'Provisioning' });
  await emitWorkspacePulse(
    submission,
    'ctp.workspace.provisioning',
    `Opening workspace for ${submission.contactName}`,
  );

  const portalResult = await createPortalAccess(
    {
      clientName: submission.contactName,
      email: submission.email,
      organization: submission.businessName,
      airtableRecordId: client.id,
    },
    EA_PORTAL_CONFIG,
  );

  if (!portalResult.ok || !portalResult.slug) {
    await updateCtpSubmission(submissionId, { workspaceStatus: 'Failed' });
    await emitWorkspacePulse(
      submission,
      'ctp.workspace.failed',
      portalResult.error ?? 'Portal access creation failed.',
      'high',
    );
    return { ok: false, error: portalResult.error ?? 'Portal access creation failed.' };
  }

  const slug = portalResult.slug;

  try {
    const { orgId } = await ensureOrganizationForPortal({
      portalSlug: slug,
      name: submission.contactName,
      clientRecordId: client.id,
      organizationName: submission.businessName,
    });
    await ensurePackageEntitlements({
      orgId,
      packagePurchased: client.packagePurchased,
      slug,
    });
  } catch (err) {
    console.error('[ctp-workspace-provision] org/entitlements failed:', err);
  }

  if (portalResult.username && portalResult.tempPassword) {
    const tempCredentials =
      `Your portal login credentials. Email: ${portalResult.username}. ` +
      `Temporary Password: ${portalResult.tempPassword}. ` +
      'Log in using the button above. Contact us to update your password at any time.';
    try {
      const portalUrl =
        portalResult.portalLoginUrl ??
        `${(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://efficiencyarchitects.online').replace(/\/$/, '')}/portal/${slug}`;
      const track =
        submission.clientTypeClassification?.label ||
        submission.clientType ||
        'discovery';
      await sendWelcomeEmail({
        clientName: submission.contactName,
        email: submission.email,
        packageName: CTP_WELCOME_PACKAGE,
        portalLoginUrl: portalUrl,
        tempCredentials,
        nextSteps: `Your ${track} workspace is live at /portal/${slug}. Review your executive brief, then book an Executive Strategy Session when you are ready to decide direction.`,
      });
    } catch (err) {
      console.error('[ctp-workspace-provision] welcome email failed:', err);
    }
  }

  await markWorkspaceActive(submission, slug);
  return { ok: true, portalSlug: slug };
}

/** Fire-and-forget — never throws; safe to call from assessment submit. */
export function scheduleCtpWorkspaceProvision(submissionId: string): void {
  void runCtpWorkspaceProvision(submissionId).catch((err) => {
    console.error('[ctp-workspace-provision] scheduled run failed:', err);
  });
}
