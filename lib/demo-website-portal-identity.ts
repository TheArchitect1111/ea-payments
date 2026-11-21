/** Website + Portal demo identity and login credentials; server-only data. */
import 'server-only';

import type { PortalClientRecord } from '@/lib/airtable';

export const DEMO_WEBSITE_PORTAL = {
  slug: 'demo-website',
  email: (
    process.env.DEMO_WEBSITE_PORTAL_EMAIL ?? 'demo-website@efficiencyarchitects.online'
  ).toLowerCase(),
  // Do not expose a known fallback portal password in client bundles.
  password: process.env.DEMO_WEBSITE_PORTAL_PASSWORD ?? '',
  clientName: 'Demo Website Client',
  organization: 'EA Website + Portal Demo',
  commerceOfferId: 'website_portal_starter',
  packagePurchased: 'Implementation Package' as const,
};

/** In-process client when Airtable seed fell back to memory. */
let seededMemoryClient: PortalClientRecord | null = null;

export function getDemoWebsitePortalCredentials() {
  return { ...DEMO_WEBSITE_PORTAL };
}

export function isDemoWebsitePortalSlug(slug: string): boolean {
  return slug.trim() === DEMO_WEBSITE_PORTAL.slug;
}

export function buildDemoWebsitePortalClientRecord(recordId: string): PortalClientRecord {
  const demo = DEMO_WEBSITE_PORTAL;
  return {
    id: recordId,
    clientName: demo.clientName,
    email: demo.email,
    organization: demo.organization,
    packagePurchased: demo.packagePurchased,
    commerceOfferId: demo.commerceOfferId,
    amountPaid: 2497,
    paymentDate: new Date().toISOString().slice(0, 10),
    portalAccessStatus: 'Active',
    portalSlug: demo.slug,
    passwordChanged: true,
    tempPassword: demo.password,
    onboardingStatus: 'In Progress',
  };
}

export function seedDemoWebsiteMemoryClient(recordId = 'memory-demo-website'): PortalClientRecord {
  seededMemoryClient = buildDemoWebsitePortalClientRecord(recordId);
  return seededMemoryClient;
}

export function getDemoWebsitePortalClientRecord(): PortalClientRecord {
  return buildDemoWebsitePortalClientRecord(seededMemoryClient?.id ?? 'demo-website-fixture');
}

export function getSeededDemoWebsiteClient(slug: string): PortalClientRecord | null {
  if (slug.trim() !== DEMO_WEBSITE_PORTAL.slug) return null;
  return seededMemoryClient;
}
