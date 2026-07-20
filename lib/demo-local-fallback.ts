import type { PortalClientRecord } from '@/lib/airtable';
import { getDemoCredentials, isDemoCredentialAttempt } from '@/lib/demo-client';
import { getDemoWebsitePortalCredentials } from '@/lib/demo-website-portal';
import { getAirtableApiKey, isProductionDeploy } from '@/lib/integration-env';

/** Local dev only: allow demo portal flows when Airtable is not configured. */
export function localDemoFallbackEnabled(): boolean {
  if (getAirtableApiKey()) return false;
  // `next dev` must work even when .env.local copies VERCEL_ENV=production placeholders.
  if (process.env.NODE_ENV === 'development') return true;
  return !isProductionDeploy();
}

export function localDemoPortalClient(slug: string): PortalClientRecord | null {
  if (!localDemoFallbackEnabled()) return null;

  const website = getDemoWebsitePortalCredentials();
  if (slug === website.slug) {
    return {
      id: 'local-demo-website',
      clientName: website.clientName,
      email: website.email,
      organization: website.organization,
      packagePurchased: website.packagePurchased,
      commerceOfferId: website.commerceOfferId,
      amountPaid: 2497,
      paymentDate: new Date().toISOString().slice(0, 10),
      portalAccessStatus: 'Active',
      portalSlug: website.slug,
      passwordChanged: true,
      tempPassword: website.password,
      onboardingStatus: 'In Progress',
    };
  }

  const demo = getDemoCredentials();
  if (slug !== demo.slug) return null;

  return {
    id: 'local-demo-client',
    clientName: demo.clientName,
    email: demo.email,
    organization: demo.organization,
    packagePurchased: 'Simplifi',
    amountPaid: 149,
    paymentDate: new Date().toISOString().slice(0, 10),
    portalAccessStatus: 'Active',
    portalSlug: demo.slug,
    passwordChanged: false,
    tempPassword: demo.password,
    onboardingStatus: 'In Progress',
  };
}

export function validateLocalDemoLogin(
  email: string,
  password: string,
): { ok: true; slug: string; recordId: string } | null {
  if (!localDemoFallbackEnabled() || !isDemoCredentialAttempt(email, password)) {
    return null;
  }

  const demo = getDemoCredentials();
  return { ok: true, slug: demo.slug, recordId: 'local-demo-client' };
}
