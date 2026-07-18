/**
 * Clone a portal tenant: client record, portal access, org/entitlements, starter site Home.
 */
import { createOrUpdateClientRecord, getClientByPortalSlug } from '@/lib/airtable';
import type { PortalConfig } from '@/lib/catalog';
import { lifecycleForProspect } from '@/lib/client-lifecycle';
import { getBrandProfile, saveBrandProfile } from '@/lib/creative-studio/brand-store';
import {
  getExperiencePage,
  listExperiencePages,
  saveExperiencePage,
} from '@/lib/experience-builder/page-store';
import { previewPathForPage } from '@/lib/experience-builder/types';
import { ensurePackageEntitlements } from '@/lib/modules/portal-modules';
import { ensureOrganizationForPortal, findOrganizationByPortalSlug } from '@/lib/organizations';
import { createPortalAccess } from '@/lib/portal-access';
import { syntheticOrgId } from '@/lib/platform-store';
import { provisionWebsitePortalSite, siteUrlForSlug } from '@/lib/provision-website-portal';

const EA_PORTAL_CONFIG: PortalConfig = {
  platform: 'efficiency-architects',
  loginPath: '/portal/login',
};

export type PortalCloneInput = {
  sourceSlug: string;
  /** Optional override for new client/org display name */
  clientName?: string;
  email?: string;
};

export type PortalCloneResult = {
  ok: boolean;
  sourceSlug: string;
  slug?: string;
  siteUrl?: string;
  portalLoginUrl?: string;
  error?: string;
  warnings: string[];
};

export async function clonePortalTenant(input: PortalCloneInput): Promise<PortalCloneResult> {
  const warnings: string[] = [];
  const sourceSlug = input.sourceSlug.trim().toLowerCase();
  if (!sourceSlug) {
    return { ok: false, sourceSlug, error: 'sourceSlug is required.', warnings };
  }

  const source = await getClientByPortalSlug(sourceSlug);
  if (!source) {
    return { ok: false, sourceSlug, error: `No client found for portal slug ${sourceSlug}.`, warnings };
  }

  const clientName = input.clientName?.trim() || `${source.clientName} Copy`;
  const email =
    input.email?.trim().toLowerCase() ||
    `clone+${Date.now()}@efficiencyarchitects.online`;

  const clientResult = await createOrUpdateClientRecord({
    clientName,
    organization: clientName,
    email,
    packagePurchased: source.packagePurchased || 'Implementation Package',
    commerceOfferId: source.commerceOfferId || 'website_portal_starter',
    amountPaid: 0,
    paymentDate: new Date().toISOString().slice(0, 10),
    stripeTransactionId: `portal-clone-${Date.now()}`,
    portalAccessStatus: 'Pending',
    onboardingStatus: 'Not Started',
    lifecycle: {
      ...lifecycleForProspect(),
      lifecycleStage: 'Discovery',
      discoveryStatus: 'Completed',
    },
  });

  if (!clientResult.ok || !clientResult.recordId) {
    return {
      ok: false,
      sourceSlug,
      error: clientResult.error || 'Failed to create client record.',
      warnings,
    };
  }

  const portalResult = await createPortalAccess(
    {
      clientName,
      email,
      organization: clientName,
      airtableRecordId: clientResult.recordId,
    },
    EA_PORTAL_CONFIG,
  );

  if (!portalResult.ok || !portalResult.slug) {
    return {
      ok: false,
      sourceSlug,
      error: portalResult.error || 'Failed to create portal access.',
      warnings,
    };
  }

  const slug = portalResult.slug;
  let organizationId: string | undefined;

  try {
    const { orgId } = await ensureOrganizationForPortal({
      portalSlug: slug,
      name: clientName,
      clientRecordId: clientResult.recordId,
      organizationName: clientName,
    });
    organizationId = orgId;
    if (!orgId.startsWith('org_')) {
      await ensurePackageEntitlements({
        orgId,
        packagePurchased: source.packagePurchased || 'Implementation Package',
        commerceOfferId: source.commerceOfferId || 'website_portal_starter',
        slug,
      });
    }
  } catch (err) {
    warnings.push(`Organization: ${err instanceof Error ? err.message : 'failed'}`);
  }

  const sourceOrg = await findOrganizationByPortalSlug(sourceSlug).catch(() => null);
  const sourceOrgId = sourceOrg?.id || syntheticOrgId(sourceSlug);

  // Copy brand from source org when available
  try {
    if (sourceOrg && organizationId) {
      const brand = await getBrandProfile(sourceOrg.id);
      await saveBrandProfile({
        ...brand,
        organizationId,
        organizationName: clientName,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    warnings.push(`Brand copy: ${err instanceof Error ? err.message : 'failed'}`);
  }

  // Copy published Home experience page when present; else provision starter
  try {
    let pages = await listExperiencePages(sourceOrgId, sourceSlug);
    if (pages.length === 0 && sourceOrgId !== syntheticOrgId(sourceSlug)) {
      pages = await listExperiencePages(syntheticOrgId(sourceSlug), sourceSlug);
    }
    const home =
      pages.find((p) => p.status === 'published' && p.title.toLowerCase() === 'home') ||
      pages.find((p) => p.status === 'published');

    if (home) {
      const full = (await getExperiencePage(home.id, sourceOrgId)) || home;
      const now = new Date().toISOString();
      const id = `exp-home-${slug}-${Date.now().toString(36)}`;
      await saveExperiencePage({
        ...full,
        id,
        organizationId: organizationId || syntheticOrgId(slug),
        portalSlug: slug,
        title: full.title || 'Home',
        status: 'published',
        updatedAt: now,
        publishedAt: now,
        previewPath: previewPathForPage(slug, id),
      });
    } else {
      const site = await provisionWebsitePortalSite({
        portalSlug: slug,
        businessName: clientName,
        organizationName: clientName,
        force: true,
      });
      if (!site.ok) warnings.push(`Website: ${site.error || 'failed'}`);
    }
  } catch (err) {
    warnings.push(`Website copy: ${err instanceof Error ? err.message : 'failed'}`);
    await provisionWebsitePortalSite({
      portalSlug: slug,
      businessName: clientName,
      organizationName: clientName,
      force: true,
    }).catch(() => undefined);
  }

  return {
    ok: true,
    sourceSlug,
    slug,
    siteUrl: siteUrlForSlug(slug),
    portalLoginUrl: portalResult.portalLoginUrl,
    warnings,
  };
}
