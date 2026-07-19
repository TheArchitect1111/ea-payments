/**
 * CTP production entry — one automated workflow after workspace is Active.
 * Reuses existing website/org provisioners. No new engines.
 *
 * Does NOT call workspace provision (avoids markWorkspaceActive → schedule loop).
 * Requires portalSlug already on the submission.
 *
 * Flow:
 *   portalSlug known → website (if required) → TenantClientConfig
 *   → persist config → connect site↔portal links → Pulse ready
 */
import {
  buildTenantClientConfigFromCtp,
  type TenantClientConfig,
} from '@/lib/ctp-tenant-config';
import { runCtpWebsiteProvision } from '@/lib/ctp-website-provision';
import {
  getCtpSubmissionById,
  updateCtpSubmission,
  type CtpSubmission,
} from '@/lib/ctp-submissions';
import { provisionWebsitePortalSite } from '@/lib/provision-website-portal';
import { publicPortalUrl } from '@/lib/ctp-portal-host';
import { emitPulseEvent } from '@/lib/pulse-bus';

export type CtpProductionProvisionResult = {
  ok: boolean;
  skipped?: boolean;
  portalSlug?: string;
  siteUrl?: string;
  config?: TenantClientConfig;
  error?: string;
};

async function persistTenantConfig(
  submission: CtpSubmission,
  config: TenantClientConfig,
): Promise<void> {
  const prev = (submission.discoveryAnswers ?? {}) as Record<string, unknown>;
  await updateCtpSubmission(submission.id, {
    discoveryAnswers: {
      ...prev,
      tenantClientConfig: config,
    },
    portalSlug: config.workspace.portalSlug,
    siteUrl: config.website.required ? config.website.siteUrl : submission.siteUrl,
  });
}

/**
 * Production provision from a CTP submission that already has a portalSlug.
 * Idempotent: safe to call when website/site already exist.
 */
export async function runCtpProductionProvision(
  submissionId: string,
): Promise<CtpProductionProvisionResult> {
  const submission = await getCtpSubmissionById(submissionId);
  if (!submission) {
    return { ok: false, error: 'CTP submission not found.' };
  }

  const portalSlug = submission.portalSlug?.trim().toLowerCase();
  if (!portalSlug) {
    return { ok: false, error: 'No portal slug' };
  }

  let siteUrl: string | undefined;

  const website = await runCtpWebsiteProvision(submissionId);
  if (!website.ok && !website.skipped) {
    return {
      ok: false,
      portalSlug,
      error: website.error ?? 'Website provision failed.',
    };
  }
  if (website.siteUrl) siteUrl = website.siteUrl;

  const fresh = (await getCtpSubmissionById(submissionId)) ?? submission;
  let config = buildTenantClientConfigFromCtp(fresh, portalSlug);
  if (siteUrl) {
    config = {
      ...config,
      website: { ...config.website, siteUrl, required: true },
    };
  }

  // Re-link starter site CTA to this tenant's portal (generic engine, config input only).
  if (config.website.required) {
    const portalHref = publicPortalUrl(portalSlug, 'ctp');
    const siteResult = await provisionWebsitePortalSite({
      portalSlug,
      businessName: config.organization.name,
      organizationName: config.organization.name,
      tagline: config.website.tagline,
      industry: config.website.industry,
      email: config.organization.email,
      portalLoginHref: portalHref,
      force: true,
    });
    if (siteResult.ok && siteResult.siteUrl) {
      siteUrl = siteResult.siteUrl;
      config = {
        ...config,
        website: { ...config.website, siteUrl: siteResult.siteUrl, required: true },
      };
    }
  }

  await persistTenantConfig(fresh, config);

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'portal.provisioned',
    title: `CTP production ready — ${config.organization.name}`,
    detail: `Portal ${config.workspace.portalUrl}${
      config.website.required ? ` · Site ${config.website.siteUrl}` : ''
    }`,
    priority: 'high',
    href: config.workspace.portalUrl,
    objectId: submissionId,
    metadata: {
      ctpSubmissionId: submissionId,
      portalSlug,
      siteUrl: siteUrl ?? '',
      brandOnboardingPath: String(config.branding.brandOnboardingPath ?? ''),
    },
  });

  return {
    ok: true,
    portalSlug,
    siteUrl,
    config,
  };
}

/** Fire-and-forget production provision after CTP workspace is Active. */
export function scheduleCtpProductionProvision(submissionId: string): void {
  void runCtpProductionProvision(submissionId).catch((err) => {
    console.error('[ctp-production-provision] scheduled run failed:', err);
  });
}
