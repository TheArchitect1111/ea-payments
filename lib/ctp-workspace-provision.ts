import { getClientByEmail, upsertProspectFromAssessment } from '@/lib/airtable';
import { sendWelcomeEmail } from '@/lib/email';
import { ensureTenantFoundation } from '@/lib/tenant-foundation';
import { createPortalAccess } from '@/lib/portal-access';
import type { PortalConfig } from '@/lib/catalog';
import { scheduleCtpStudioCampaign } from '@/lib/ctp-studio-bridge';
import { scheduleCtpProductionProvision } from '@/lib/ctp-production-provision';
import { scheduleCtpProduction } from '@/lib/ctp-production-run';
import { publicPortalLoginUrl, publicPortalUrl } from '@/lib/ctp-portal-host';
import {
  opportunityDashboardPublicUrl,
} from '@/lib/ctp-opportunity-routes';
import { sendCtpExecutiveEmailForSubmission } from '@/lib/ctp-executive-email-send';
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

function emailWorkspaceUrl(portalSlug: string, _clientType?: CtpSubmission['clientType']): string {
  return opportunityDashboardPublicUrl(portalSlug);
}

function portalLoginUrl(): string {
  return publicPortalLoginUrl();
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
    `Portal ready at ${publicPortalUrl(portalSlug)}`,
  );

  try {
    await sendCtpExecutiveEmailForSubmission(submission.id, {
      portalUrl: emailWorkspaceUrl(portalSlug, submission.clientType),
    });
  } catch (err) {
    console.error('[ctp-workspace-provision] executive email failed:', err);
  }

  scheduleCtpStudioCampaign(submission.id);
  // Production provision includes website + TenantClientConfig persistence + site↔portal relink.
  scheduleCtpProductionProvision(submission.id);
  scheduleCtpProduction(submission.id);
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

  let client = await getClientByEmail(submission.email);
  if (!client?.id) {
    try {
      await upsertProspectFromAssessment({
        contactName: submission.contactName,
        businessName: submission.businessName,
        email: submission.email,
        assessmentId: submission.assessmentId || submission.id,
      });
    } catch (err) {
      console.error('[ctp-workspace-provision] prospect upsert recovery failed:', err);
    }
    client = await getClientByEmail(submission.email);
  }
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
    await ensureTenantFoundation({
      portalSlug: slug,
      clientName: submission.contactName,
      clientRecordId: client.id,
      organizationName: submission.businessName,
      packagePurchased: client.packagePurchased,
      commerceOfferId: client.commerceOfferId,
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
      // Hub portal CTAs by default (publicPortalUrl); vanity opt-in via EA_PORTAL_USE_VANITY_URLS=1
      // over hub /portal/login links from createPortalAccess.
      const portalUrl = publicPortalUrl(slug, 'ctp');
      const loginUrl = portalLoginUrl();
      await sendWelcomeEmail({
        clientName: submission.contactName,
        email: submission.email,
        packageName: CTP_WELCOME_PACKAGE,
        portalLoginUrl: loginUrl,
        tempCredentials,
        nextSteps: `Your workspace is ready at ${portalUrl}. Sign in at ${loginUrl}, then open Consider the Possibilities to see what we found and continue at your own pace.`,
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
