/**
 * Dedicated Website + Portal demo fixture (not Simplifi demo-client).
 * Ensures ctp entitlement + linked CTP submission so login lands in Client Experience.
 */
import type { PortalClientRecord } from '@/lib/airtable';
import { ensureOrganizationForPortal } from '@/lib/organizations';
import { ensurePackageEntitlements } from '@/lib/modules/portal-modules';
import { ensureCtpWorkspaceForWebsitePortal } from '@/lib/ctp-website-portal-workspace';
import { getAirtableApiKey, isProductionDeploy } from '@/lib/integration-env';

function websiteDemoLocalMode(): boolean {
  if (getAirtableApiKey()) return false;
  if (process.env.NODE_ENV === 'development') return true;
  return !isProductionDeploy();
}

const BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const TABLE = 'Client Records';

const DEMO_WEBSITE = {
  slug: 'demo-website',
  email: (
    process.env.DEMO_WEBSITE_PORTAL_EMAIL ?? 'demo-website@efficiencyarchitects.online'
  ).toLowerCase(),
  password: process.env.DEMO_WEBSITE_PORTAL_PASSWORD ?? 'DemoWebsite2026!',
  clientName: 'Demo Website Client',
  organization: 'EA Website + Portal Demo',
  commerceOfferId: 'website_portal_starter',
  /** Coarse Airtable package; entitlements prefer commerceOfferId. */
  packagePurchased: 'Implementation Package' as const,
};

/** In-process client when Airtable is unavailable (dev / unreachable). */
let seededMemoryClient: PortalClientRecord | null = null;

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

function buildDemoClientRecord(recordId: string): PortalClientRecord {
  const demo = DEMO_WEBSITE;
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

function seedMemoryClient(recordId = 'memory-demo-website'): PortalClientRecord {
  seededMemoryClient = buildDemoClientRecord(recordId);
  return seededMemoryClient;
}

export function getDemoWebsitePortalCredentials() {
  return { ...DEMO_WEBSITE };
}

export function isDemoWebsitePortalSlug(slug: string): boolean {
  return slug.trim() === DEMO_WEBSITE.slug;
}

export function getDemoWebsitePortalClientRecord(): PortalClientRecord {
  return buildDemoClientRecord(seededMemoryClient?.id ?? 'demo-website-fixture');
}

/** Used by getClientByPortalSlug when Airtable seed fell back to memory. */
export function getSeededDemoWebsiteClient(slug: string): PortalClientRecord | null {
  if (slug.trim() !== DEMO_WEBSITE.slug) return null;
  return seededMemoryClient;
}

async function seedWorkspace(): Promise<{ ok: boolean; error?: string }> {
  const demo = DEMO_WEBSITE;
  const workspace = await ensureCtpWorkspaceForWebsitePortal({
    portalSlug: demo.slug,
    email: demo.email,
    clientName: demo.clientName,
    organization: demo.organization,
  });
  if (!workspace.ok) {
    return { ok: false, error: workspace.error || 'CTP workspace seed failed.' };
  }
  return { ok: true };
}

async function seedMemoryFixture(): Promise<{ ok: boolean; error?: string; portalSlug?: string }> {
  seedMemoryClient();
  const workspace = await seedWorkspace();
  if (!workspace.ok) return { ok: false, error: workspace.error };
  return { ok: true, portalSlug: DEMO_WEBSITE.slug };
}

export async function ensureDemoWebsitePortal(): Promise<{
  ok: boolean;
  error?: string;
  portalSlug?: string;
}> {
  const demo = DEMO_WEBSITE;

  if (websiteDemoLocalMode()) {
    return seedMemoryFixture();
  }

  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  const safe = demo.slug.replace(/'/g, "\\'");
  const formula = encodeURIComponent(`{Portal Slug}='${safe}'`);
  const lookupUrl = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?filterByFormula=${formula}&maxRecords=1`;

  try {
    const lookup = await fetch(lookupUrl, { headers: authHeaders(), cache: 'no-store' });
    if (!lookup.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[demo-website-portal] Airtable unreachable — using memory fixture');
        return seedMemoryFixture();
      }
      return { ok: false, error: 'Could not reach client database.' };
    }

    const data = (await lookup.json()) as { records?: { id: string }[] };

    const fields: Record<string, unknown> = {
      'Client Name': demo.clientName,
      Email: demo.email,
      Organization: demo.organization,
      'Package Purchased': demo.packagePurchased,
      'Commerce Offer Id': demo.commerceOfferId,
      'Amount Paid': 2497,
      'Payment Date': new Date().toISOString().slice(0, 10),
      'Stripe Transaction ID': 'demo_website_portal_provision',
      'Portal Access Status': 'Active',
      'Onboarding Status': 'In Progress',
      'Portal Username': demo.email,
      'Portal Slug': demo.slug,
      'Temp Password': demo.password,
      'Password Changed': true,
      'Payment Received At': new Date().toISOString(),
    };

    let recordId = data.records?.[0]?.id;
    if (recordId) {
      const res = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}/${recordId}`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ fields, typecast: true }),
        },
      );
      if (!res.ok) {
        if (process.env.NODE_ENV === 'development') return seedMemoryFixture();
        return { ok: false, error: 'Could not refresh Website + Portal demo client.' };
      }
    } else {
      const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      });
      if (!res.ok) {
        if (process.env.NODE_ENV === 'development') return seedMemoryFixture();
        return { ok: false, error: 'Could not create Website + Portal demo client.' };
      }
      const created = (await res.json()) as { records?: { id: string }[] };
      recordId = created.records?.[0]?.id;
    }

    if (!recordId) {
      if (process.env.NODE_ENV === 'development') return seedMemoryFixture();
      return { ok: false, error: 'Demo client record id missing.' };
    }

    seedMemoryClient(recordId);

    try {
      const org = await ensureOrganizationForPortal({
        portalSlug: demo.slug,
        name: demo.clientName,
        clientRecordId: recordId,
        organizationName: demo.organization,
      });
      await ensurePackageEntitlements({
        orgId: org.orgId,
        packagePurchased: demo.packagePurchased,
        commerceOfferId: demo.commerceOfferId,
        slug: demo.slug,
      });
    } catch (err) {
      console.error('[demo-website-portal] org/entitlements failed:', err);
    }

    const workspace = await seedWorkspace();
    if (!workspace.ok) {
      return { ok: false, error: workspace.error };
    }

    return { ok: true, portalSlug: demo.slug };
  } catch {
    if (process.env.NODE_ENV === 'development') {
      return seedMemoryFixture();
    }
    return { ok: false, error: 'Unexpected error provisioning Website + Portal demo.' };
  }
}
