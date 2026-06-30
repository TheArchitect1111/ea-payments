import {
  ORGANIZATIONS_TABLE,
  escapeAirtableString,
  platformCreate,
  platformQuery,
  platformStoreConfigured,
  platformUpdate,
  syntheticOrgId,
  type AirtableRecord,
} from '@/lib/platform-store';

export type OrganizationStatus = 'Active' | 'Suspended';

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  brandColors?: string;
  mission?: string;
  industry?: string;
  status: OrganizationStatus;
  portalSlug?: string;
  clientRecordId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionPlanId?: string;
  subscriptionStatus?: string;
};

function mapOrganization(record: AirtableRecord): Organization {
  const f = record.fields;
  return {
    id: record.id,
    name: String(f['Name'] ?? ''),
    slug: String(f['Slug'] ?? ''),
    logo: f['Logo'] ? String(f['Logo']) : undefined,
    brandColors: f['Brand Colors'] ? String(f['Brand Colors']) : undefined,
    mission: f['Mission'] ? String(f['Mission']) : undefined,
    industry: f['Industry'] ? String(f['Industry']) : undefined,
    status: (f['Status'] as OrganizationStatus) || 'Active',
    portalSlug: f['Portal Slug'] ? String(f['Portal Slug']) : undefined,
    clientRecordId: f['Client Record Id'] ? String(f['Client Record Id']) : undefined,
    stripeCustomerId: f['Stripe Customer Id'] ? String(f['Stripe Customer Id']) : undefined,
    stripeSubscriptionId: f['Stripe Subscription Id'] ? String(f['Stripe Subscription Id']) : undefined,
    subscriptionPlanId: f['Subscription Plan Id'] ? String(f['Subscription Plan Id']) : undefined,
    subscriptionStatus: f['Subscription Status'] ? String(f['Subscription Status']) : undefined,
  };
}

export async function getOrganizationById(orgId: string): Promise<Organization | null> {
  if (!platformStoreConfigured() || orgId.startsWith('org_')) {
    return null;
  }

  const records = await platformQuery(
    ORGANIZATIONS_TABLE,
    `RECORD_ID()='${orgId.replace(/'/g, "\\'")}'`,
    1,
  );
  return records[0] ? mapOrganization(records[0]) : null;
}

export async function findOrganizationByPortalSlug(
  portalSlug: string,
): Promise<Organization | null> {
  if (!platformStoreConfigured()) return null;

  const safe = escapeAirtableString(portalSlug);
  const records = await platformQuery(
    ORGANIZATIONS_TABLE,
    `OR(LOWER({Portal Slug})='${safe}', LOWER({Slug})='${safe}')`,
    1,
  );
  return records[0] ? mapOrganization(records[0]) : null;
}

export async function createOrganization(input: {
  name: string;
  slug: string;
  portalSlug: string;
  clientRecordId?: string;
  mission?: string;
  industry?: string;
}): Promise<Organization | null> {
  if (!platformStoreConfigured()) return null;

  const record = await platformCreate(ORGANIZATIONS_TABLE, {
    Name: input.name,
    Slug: input.slug,
    'Portal Slug': input.portalSlug,
    Status: 'Active',
    ...(input.clientRecordId ? { 'Client Record Id': input.clientRecordId } : {}),
    ...(input.mission ? { Mission: input.mission } : {}),
    ...(input.industry ? { Industry: input.industry } : {}),
  });

  return record ? mapOrganization(record) : null;
}

export async function ensureOrganizationForPortal(input: {
  portalSlug: string;
  name: string;
  clientRecordId?: string;
  organizationName?: string;
}): Promise<{ orgId: string; org: Organization | null }> {
  const fallbackId = syntheticOrgId(input.portalSlug);

  if (!platformStoreConfigured()) {
    return { orgId: fallbackId, org: null };
  }

  try {
    const existing = await findOrganizationByPortalSlug(input.portalSlug);
    if (existing) {
      return { orgId: existing.id, org: existing };
    }

    const orgName = input.organizationName?.trim() || input.name;
    const created = await createOrganization({
      name: orgName,
      slug: input.portalSlug,
      portalSlug: input.portalSlug,
      clientRecordId: input.clientRecordId,
    });

    if (created) {
      return { orgId: created.id, org: created };
    }
  } catch (err) {
    console.error('ensureOrganizationForPortal failed:', err);
  }

  return { orgId: fallbackId, org: null };
}

export async function suspendOrganization(orgId: string): Promise<boolean> {
  if (!platformStoreConfigured() || orgId.startsWith('org_')) return false;
  const updated = await platformUpdate(ORGANIZATIONS_TABLE, orgId, { Status: 'Suspended' });
  return Boolean(updated);
}

export async function findOrganizationByStripeCustomerId(
  stripeCustomerId: string,
): Promise<Organization | null> {
  if (!platformStoreConfigured() || !stripeCustomerId) return null;

  const safe = stripeCustomerId.replace(/'/g, "\\'");
  const records = await platformQuery(
    ORGANIZATIONS_TABLE,
    `{Stripe Customer Id}='${safe}'`,
    1,
  );
  return records[0] ? mapOrganization(records[0]) : null;
}

export async function updateOrganizationBilling(
  orgId: string,
  input: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionPlanId?: string;
    subscriptionStatus?: string;
  },
): Promise<Organization | null> {
  if (!platformStoreConfigured() || orgId.startsWith('org_')) return null;

  const fields: Record<string, string> = {};
  if (input.stripeCustomerId) fields['Stripe Customer Id'] = input.stripeCustomerId;
  if (input.stripeSubscriptionId) fields['Stripe Subscription Id'] = input.stripeSubscriptionId;
  if (input.subscriptionPlanId) fields['Subscription Plan Id'] = input.subscriptionPlanId;
  if (input.subscriptionStatus) fields['Subscription Status'] = input.subscriptionStatus;

  if (Object.keys(fields).length === 0) return getOrganizationById(orgId);

  const updated = await platformUpdate(ORGANIZATIONS_TABLE, orgId, fields);
  return updated ? mapOrganization(updated) : null;
}
