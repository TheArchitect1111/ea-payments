/**
 * Shared paid-client fulfillment: portal → org entitlements → Connect → optional site.
 * Used by Stripe fixed-package checkout and proposal payment (parity).
 */
import type { AirtablePackage } from '@/lib/airtable';
import type { PortalConfig } from '@/lib/catalog';
import { createPortalAccess } from '@/lib/portal-access';
import { ensureOrganizationForPortal } from '@/lib/organizations';
import { ensurePackageEntitlements } from '@/lib/modules/portal-modules';
import { provisionConnectAfterCheckout } from '@/lib/connect-provision-hook';
import { provisionWebsitePortalSite } from '@/lib/provision-website-portal';
import {
  createMagicLinkToken,
  magicLinkConfigured,
  WELCOME_MAGIC_LINK_TTL_MS,
} from '@/lib/magic-link';
import { publicPortalLoginUrl } from '@/lib/ctp-portal-host';
import { opportunityDashboardPath } from '@/lib/ctp-opportunity-routes';
import { ensureCtpWorkspaceForWebsitePortal } from '@/lib/ctp-website-portal-workspace';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export const DEFAULT_PORTAL_CONFIG: PortalConfig = {
  platform: 'efficiency-architects',
  loginPath: '/portal/login',
};

export type FulfillPaidClientInput = {
  clientName: string;
  email: string;
  organization?: string;
  airtableRecordId: string;
  packagePurchased: AirtablePackage | string;
  commerceOfferId?: string;
  portalConfig?: PortalConfig;
  /** When true, provision public /sites/{slug} + welcome magic link. */
  provisionWebsite?: boolean;
  tagline?: string;
  industry?: string;
  connectIndustry?: string | null;
};

export type FulfillPaidClientResult = {
  ok: boolean;
  portalSlug?: string;
  portalLoginUrl: string;
  tempCredentials?: string;
  siteUrl?: string;
  magicLoginUrl?: string;
  orgId?: string;
  error?: string;
};

function credentialsLine(username: string, tempPassword: string): string {
  return (
    `Your portal login credentials: Email: ${username} | Temporary Password: ${tempPassword}` +
    ' Log in using the button above. Contact us to update your password at any time.'
  );
}

/**
 * After Client Record exists: create portal, entitlements, Connect, optional website.
 */
export async function fulfillPaidClient(
  input: FulfillPaidClientInput,
): Promise<FulfillPaidClientResult> {
  const portalLoginFallback = publicPortalLoginUrl();
  const portalConfig = input.portalConfig ?? DEFAULT_PORTAL_CONFIG;

  let portalSlug: string | undefined;
  let portalLoginUrl = portalLoginFallback;
  let tempCredentials: string | undefined;
  let siteUrl: string | undefined;
  let magicLoginUrl: string | undefined;
  let orgId: string | undefined;

  try {
    const portalResult = await createPortalAccess(
      {
        clientName: input.clientName,
        email: input.email,
        organization: input.organization,
        airtableRecordId: input.airtableRecordId,
      },
      portalConfig,
    );

    if (!portalResult.ok) {
      return {
        ok: false,
        portalLoginUrl,
        error: portalResult.error ?? 'Portal access creation failed',
      };
    }

    portalSlug = portalResult.slug;
    if (portalResult.portalLoginUrl) portalLoginUrl = portalResult.portalLoginUrl;
    if (portalResult.username && portalResult.tempPassword) {
      tempCredentials = credentialsLine(portalResult.username, portalResult.tempPassword);
    }

    if (!portalSlug) {
      return { ok: true, portalLoginUrl, tempCredentials };
    }

    try {
      const org = await ensureOrganizationForPortal({
        portalSlug,
        name: input.clientName,
        clientRecordId: input.airtableRecordId,
        organizationName: input.organization,
      });
      orgId = org.orgId;

      await ensurePackageEntitlements({
        orgId,
        packagePurchased: input.packagePurchased,
        commerceOfferId: input.commerceOfferId,
        slug: portalSlug,
      });

      await provisionConnectAfterCheckout({
        portalSlug,
        organizationName: input.clientName,
        ownerEmail: input.email,
        packagePurchased: input.commerceOfferId || String(input.packagePurchased),
        connectIndustry: input.connectIndustry ?? null,
      });

      if (input.provisionWebsite) {
        const siteResult = await provisionWebsitePortalSite({
          portalSlug,
          businessName: input.clientName,
          organizationName: input.organization,
          organizationId: orgId,
          clientRecordId: input.airtableRecordId,
          tagline: input.tagline,
          industry: input.industry,
          email: input.email,
        });
        if (!siteResult.ok) {
          const message =
            siteResult.error ||
            'Website publish blocked by Experience Director (unified publish gate).';
          console.error('fulfillPaidClient website provision failed:', message, {
            approvalStatus: siteResult.directorReview?.approvalStatus,
            overall: siteResult.directorReview?.scores?.overall,
          });
          return {
            ok: false,
            portalSlug,
            portalLoginUrl,
            tempCredentials,
            orgId,
            error: message,
          };
        }
        if (siteResult.siteUrl) {
          siteUrl = siteResult.siteUrl;
        }

        // Option A: bind standard CTP workspace to the portal already provisioned above.
        try {
          const workspace = await ensureCtpWorkspaceForWebsitePortal({
            portalSlug,
            email: input.email,
            clientName: input.clientName,
            organization: input.organization,
            siteUrl,
          });
          if (!workspace.ok) {
            console.error(
              'fulfillPaidClient CTP workspace bind failed:',
              workspace.error || 'unknown',
            );
          }
        } catch (err) {
          console.error('fulfillPaidClient CTP workspace bind threw:', err);
        }

        const ctpLanding = opportunityDashboardPath(portalSlug);
        if (magicLinkConfigured()) {
          const token = createMagicLinkToken({
            realm: 'portal',
            email: input.email,
            next: ctpLanding,
            ttlMs: WELCOME_MAGIC_LINK_TTL_MS,
          });
          if (token) {
            const origin = (
              process.env.NEXT_PUBLIC_SITE_URL ||
              process.env.NEXT_PUBLIC_BASE_URL ||
              EA_PLATFORM_URL
            ).replace(/\/$/, '');
            magicLoginUrl = `${origin}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`;
          }
        }
      }
    } catch (err) {
      console.error('fulfillPaidClient entitlement/site sync failed:', err);
    }

    return {
      ok: true,
      portalSlug,
      portalLoginUrl,
      tempCredentials,
      siteUrl,
      magicLoginUrl,
      orgId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fulfillPaidClient failed';
    console.error('fulfillPaidClient threw:', err);
    return { ok: false, portalLoginUrl, error: message };
  }
}
