/**
 * Auto-provision a starter public site for CTP tracks that need a website.
 * Reuses the Website + Portal Starter provisioner — no separate site engine.
 */
import { getClientByEmail } from '@/lib/airtable';
import { createPortalAccess } from '@/lib/portal-access';
import type { PortalConfig } from '@/lib/catalog';
import {
  getCtpSubmissionById,
  updateCtpSubmission,
  type CtpSubmission,
} from '@/lib/ctp-submissions';
import { provisionWebsitePortalSite, siteUrlForSlug } from '@/lib/provision-website-portal';
import { emitPulseEvent } from '@/lib/pulse-bus';
import { ensureOrganizationForPortal } from '@/lib/organizations';
import { ensurePackageEntitlements } from '@/lib/modules/portal-modules';
import { scheduleCtpProduction } from '@/lib/ctp-production-run';

const EA_PORTAL_CONFIG: PortalConfig = {
  platform: 'efficiency-architects',
  loginPath: '/portal/login',
};

function wantsWebsite(submission: CtpSubmission): boolean {
  if (submission.clientTypeClassification?.websiteRequired) return true;
  return submission.clientType === 'website' || submission.clientType === 'website_portal';
}

function discoveryString(answers: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = answers?.[key];
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

export async function runCtpWebsiteProvision(
  submissionId: string,
): Promise<{ ok: boolean; skipped?: boolean; siteUrl?: string; error?: string }> {
  const submission = await getCtpSubmissionById(submissionId);
  if (!submission) {
    return { ok: false, error: 'CTP submission not found.' };
  }

  if (!wantsWebsite(submission)) {
    return { ok: true, skipped: true };
  }

  if (submission.siteUrl) {
    return { ok: true, siteUrl: submission.siteUrl, skipped: true };
  }

  let portalSlug = submission.portalSlug?.trim().toLowerCase();

  if (!portalSlug) {
    const client = await getClientByEmail(submission.email);
    if (!client?.id) {
      return { ok: false, error: 'No client record found for website provision.' };
    }

    if (client.portalSlug && client.portalAccessStatus === 'Active') {
      portalSlug = client.portalSlug;
    } else {
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
        return { ok: false, error: portalResult.error ?? 'Could not create portal slug for site.' };
      }
      portalSlug = portalResult.slug;
      try {
        const { orgId } = await ensureOrganizationForPortal({
          portalSlug,
          name: submission.contactName,
          clientRecordId: client.id,
          organizationName: submission.businessName,
        });
        await ensurePackageEntitlements({
          orgId,
          packagePurchased: client.packagePurchased,
          commerceOfferId:
            submission.clientType === 'website_portal' ? 'website_portal_starter' : undefined,
          slug: portalSlug,
        });
      } catch (err) {
        console.error('[ctp-website-provision] org/entitlements failed:', err);
      }
    }

    await updateCtpSubmission(submission.id, { portalSlug });
  }

  const answers = submission.discoveryAnswers;
  const siteResult = await provisionWebsitePortalSite({
    portalSlug,
    businessName: submission.businessName,
    organizationName: submission.businessName,
    tagline:
      discoveryString(answers, 'success_definition') ||
      discoveryString(answers, 'offer_summary') ||
      discoveryString(answers, 'landing_goal'),
    industry: discoveryString(answers, 'industry') || discoveryString(answers, 'organization_type'),
    email: submission.email,
  });

  if (!siteResult.ok || !siteResult.siteUrl) {
    await emitPulseEvent({
      product: 'ea-platform',
      type: 'ctp.website.failed',
      title: `CTP website failed — ${submission.businessName}`,
      detail: siteResult.error ?? 'Website provision failed',
      priority: 'high',
      href: '/admin/ctp',
      objectId: submission.id,
      metadata: {
        ctpSubmissionId: submission.id,
        portalSlug,
        clientType: submission.clientType ?? '',
      },
    });
    return { ok: false, error: siteResult.error ?? 'Website provision failed' };
  }

  const siteUrl = siteResult.siteUrl || siteUrlForSlug(portalSlug);
  await updateCtpSubmission(submission.id, { siteUrl, portalSlug });

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'ctp.website.live',
    title: `CTP website live — ${submission.businessName}`,
    detail: siteUrl,
    priority: 'high',
    href: siteUrl,
    objectId: submission.id,
    metadata: {
      ctpSubmissionId: submission.id,
      portalSlug,
      siteUrl,
      clientType: submission.clientType ?? '',
    },
  });

  // Refresh production package so artifacts include the live site URL.
  scheduleCtpProduction(submission.id, { force: true });

  return { ok: true, siteUrl };
}

/** Fire-and-forget — safe from assessment submit / workspace provision. */
export function scheduleCtpWebsiteProvision(submissionId: string): void {
  void runCtpWebsiteProvision(submissionId).catch((err) => {
    console.error('[ctp-website-provision] scheduled run failed:', err);
  });
}
