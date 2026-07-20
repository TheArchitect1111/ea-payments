/**
 * Dedicated Website + Portal demo fixture (not Simplifi demo-client).
 * Server-only ensure path — do not import from client bundles.
 */
import { ensureOrganizationForPortal } from '@/lib/organizations';
import { ensurePackageEntitlements } from '@/lib/modules/portal-modules';
import { ensureCtpWorkspaceForWebsitePortal } from '@/lib/ctp-website-portal-workspace';
import { getAirtableApiKey, isProductionDeploy } from '@/lib/integration-env';
import {
  DEMO_WEBSITE_PORTAL,
  getDemoWebsitePortalCredentials,
  getDemoWebsitePortalClientRecord,
  getSeededDemoWebsiteClient,
  isDemoWebsitePortalSlug,
  seedDemoWebsiteMemoryClient,
} from '@/lib/demo-website-portal-identity';

export {
  getDemoWebsitePortalCredentials,
  getDemoWebsitePortalClientRecord,
  getSeededDemoWebsiteClient,
  isDemoWebsitePortalSlug,
};

function websiteDemoLocalMode(): boolean {
  if (getAirtableApiKey()) return false;
  if (process.env.NODE_ENV === 'development') return true;
  return !isProductionDeploy();
}

const BASE_ID =
  process.env.AIRTABLE_PAYMENTS_BASE_ID?.trim() || 'appv0YoLIMY45fmDA';
const TABLE = 'Client Records';

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function seedWorkspace(): Promise<{ ok: boolean; error?: string }> {
  const demo = DEMO_WEBSITE_PORTAL;
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
  seedDemoWebsiteMemoryClient();
  const workspace = await seedWorkspace();
  if (!workspace.ok) return { ok: false, error: workspace.error };
  return { ok: true, portalSlug: DEMO_WEBSITE_PORTAL.slug };
}

export async function ensureDemoWebsitePortal(): Promise<{
  ok: boolean;
  error?: string;
  portalSlug?: string;
}> {
  const demo = DEMO_WEBSITE_PORTAL;

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

    seedDemoWebsiteMemoryClient(recordId);

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
