/**
 * Phone-friendly admin show: create portal + starter site for a prospect demo.
 * Reuses createPortalAccess + website provision — no new engines.
 */
import type { PortalConfig } from '@/lib/catalog';
import { createOrUpdateClientRecord } from '@/lib/airtable';
import { createPortalAccess } from '@/lib/portal-access';
import { ensureOrganizationForPortal } from '@/lib/organizations';
import { ensurePackageEntitlements } from '@/lib/modules/portal-modules';
import {
  provisionWebsitePortalSite,
  siteUrlForSlug,
} from '@/lib/provision-website-portal';
import { publicPortalUrl } from '@/lib/ctp-portal-host';
import { emitPulseEvent } from '@/lib/pulse-bus';

const EA_PORTAL_CONFIG: PortalConfig = {
  platform: 'efficiency-architects',
  loginPath: '/portal/login',
};

export type AdminShowProvisionInput = {
  businessName: string;
  email?: string;
  tagline?: string;
};

export type AdminShowProvisionResult = {
  ok: boolean;
  portalSlug?: string;
  siteUrl?: string;
  portalUrl?: string;
  enterUrl?: string;
  email?: string;
  tempPassword?: string;
  error?: string;
};

function showEmailForName(businessName: string): string {
  const base = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24) || 'client';
  return `show+${base}-${Date.now().toString(36)}@efficiencyarchitects.online`;
}

export async function runAdminShowProvision(
  input: AdminShowProvisionInput,
): Promise<AdminShowProvisionResult> {
  const businessName = input.businessName.trim();
  if (!businessName) {
    return { ok: false, error: 'Business name is required.' };
  }

  const email = (input.email?.trim() || showEmailForName(businessName)).toLowerCase();
  const today = new Date().toISOString().slice(0, 10);

  // EA createPortalAccess requires an existing Client Records row.
  const clientRow = await createOrUpdateClientRecord({
    clientName: businessName,
    organization: businessName,
    email,
    packagePurchased: 'Website + Portal Starter',
    commerceOfferId: 'website_portal_starter',
    amountPaid: 0,
    paymentDate: today,
    stripeTransactionId: `admin-show-${Date.now().toString(36)}`,
    portalAccessStatus: 'Pending',
    onboardingStatus: 'Not Started',
  });
  if (!clientRow.ok || !clientRow.recordId) {
    return {
      ok: false,
      error: clientRow.error ?? 'Could not create Client Records row for show.',
    };
  }

  const portalResult = await createPortalAccess(
    {
      clientName: businessName,
      email,
      organization: businessName,
      airtableRecordId: clientRow.recordId,
    },
    EA_PORTAL_CONFIG,
  );

  if (!portalResult.ok || !portalResult.slug) {
    return { ok: false, error: portalResult.error ?? 'Could not create portal.' };
  }

  const portalSlug = portalResult.slug;

  try {
    const { orgId } = await ensureOrganizationForPortal({
      portalSlug,
      name: businessName,
      organizationName: businessName,
    });
    await ensurePackageEntitlements({
      orgId,
      packagePurchased: 'Website + Portal Starter',
      commerceOfferId: 'website_portal_starter',
      slug: portalSlug,
    });
  } catch (err) {
    console.error('[admin-show-provision] org/entitlements failed:', err);
  }

  const portalCtpUrl = publicPortalUrl(portalSlug, 'ctp');
  const siteResult = await provisionWebsitePortalSite({
    portalSlug,
    businessName,
    organizationName: businessName,
    tagline: input.tagline?.trim() || undefined,
    email: portalResult.username || email,
    portalLoginHref: portalCtpUrl,
    force: true,
  });

  if (!siteResult.ok) {
    return {
      ok: false,
      error: siteResult.error ?? 'Portal created but site provision failed.',
      portalSlug,
      portalUrl: portalCtpUrl,
    };
  }

  void emitPulseEvent({
    product: 'ea-platform',
    type: 'portal.provisioned',
    title: `Show ready — ${businessName}`,
    detail: `Portal ${portalCtpUrl} · Site ${siteResult.siteUrl ?? siteUrlForSlug(portalSlug)}`,
    priority: 'medium',
    href: portalCtpUrl,
    objectId: portalSlug,
    metadata: {
      portalSlug,
      mode: 'admin-show',
      siteUrl: siteResult.siteUrl ?? siteUrlForSlug(portalSlug),
    },
  });

  return {
    ok: true,
    portalSlug,
    siteUrl: siteResult.siteUrl ?? siteUrlForSlug(portalSlug),
    portalUrl: portalCtpUrl,
    enterUrl: `/api/admin/show/enter?slug=${encodeURIComponent(portalSlug)}`,
    email: portalResult.username || email,
    tempPassword: portalResult.tempPassword,
  };
}
