import { upsertProspectFromAssessment } from '@/lib/airtable';
import { ensureCtpWorkspaceForWebsitePortal } from '@/lib/ctp-website-portal-workspace';
import { fulfillPaidClient } from '@/lib/fulfill-paid-client';
import { updateOrganizationWorkspaceConfig } from '@/lib/organizations';

export type ExperiencePortalProvisionInput = {
  clientName: string;
  organization: string;
  email: string;
  themeId: string;
  workspaceName: string;
  primaryColor: string;
  accentColor: string;
};

export type ExperiencePortalProvisionResult = {
  ok: boolean;
  portalSlug?: string;
  orgId?: string;
  tempCredentials?: string;
  error?: string;
};

/** Provision a real tenant through the existing Client Record → Portal → CTP workspace path. */
export async function provisionExperiencePortalTenant(
  input: ExperiencePortalProvisionInput,
): Promise<ExperiencePortalProvisionResult> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, error: 'Experience portal email is required.' };

  const clientRecord = await upsertProspectFromAssessment({
    contactName: input.clientName,
    businessName: input.organization,
    email,
    assessmentId: `experience-preset-${input.themeId}`,
  });
  if (!clientRecord.ok || !clientRecord.recordId) {
    return { ok: false, error: 'Could not create or reuse the portal client.' };
  }

  const fulfilled = await fulfillPaidClient({
    clientName: input.clientName,
    organization: input.organization,
    email,
    airtableRecordId: clientRecord.recordId,
    packagePurchased: 'Implementation Package',
    commerceOfferId: 'website_portal_starter',
    provisionWebsite: false,
  });
  if (!fulfilled.ok || !fulfilled.portalSlug || !fulfilled.orgId) {
    return { ok: false, error: fulfilled.error || 'Could not create the portal tenant.' };
  }

  const workspace = await ensureCtpWorkspaceForWebsitePortal({
    portalSlug: fulfilled.portalSlug,
    email,
    clientName: input.clientName,
    organization: input.organization,
  });
  if (!workspace.ok) {
    return { ok: false, error: workspace.error || 'Could not bind the CTP workspace.' };
  }

  await updateOrganizationWorkspaceConfig(fulfilled.orgId, {
    themeId: input.themeId,
    personalityId: 'creative',
    workspaceName: input.workspaceName,
    brandColors: JSON.stringify({
      primary: input.primaryColor,
      accent: input.accentColor,
    }),
  });

  return {
    ok: true,
    portalSlug: fulfilled.portalSlug,
    orgId: fulfilled.orgId,
    tempCredentials: fulfilled.tempCredentials,
  };
}
