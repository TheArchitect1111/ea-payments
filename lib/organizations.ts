import { airtableCreate } from '@/lib/data/airtable-client';
import {
  ORGANIZATIONS_TABLE,
  escapeAirtableString,
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
  /** Platform preset id: ea | cpr | etfm | 3hc | bob-rumball */
  platformClientId?: string;
  themeId?: string;
  personalityId?: string;
  workspaceName?: string;
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
    platformClientId: f['Platform Client Id'] ? String(f['Platform Client Id']) : undefined,
    themeId: f['Theme Id'] ? String(f['Theme Id']) : undefined,
    personalityId: f['Personality Id'] ? String(f['Personality Id']) : undefined,
    workspaceName: f['Workspace Name'] ? String(f['Workspace Name']) : undefined,
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

/** List Organizations from Airtable for admin pickers (Entitlements, Org workspace). */
export async function listOrganizations(options?: {
  status?: OrganizationStatus | 'All';
  maxRecords?: number;
}): Promise<Organization[]> {
  if (!platformStoreConfigured()) return [];

  const status = options?.status ?? 'Active';
  const maxRecords = options?.maxRecords ?? 100;
  const filterByFormula =
    status === 'All' ? undefined : `{Status}='${status.replace(/'/g, "\\'")}'`;

  const records = await platformQuery(ORGANIZATIONS_TABLE, filterByFormula, maxRecords);
  return records
    .map(mapOrganization)
    .filter((org) => Boolean(org.id) && Boolean(org.name))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function findOrganizationByPortalSlug(
  portalSlug: string,
): Promise<Organization | null> {
  if (!platformStoreConfigured()) return null;

  const safe = escapeAirtableString(portalSlug);

  // Query Slug first — production Organizations may not have Portal Slug yet.
  // Airtable rejects the whole formula if any referenced field is missing.
  try {
    const bySlug = await platformQuery(
      ORGANIZATIONS_TABLE,
      `LOWER({Slug})='${safe}'`,
      1,
    );
    if (bySlug[0]) return mapOrganization(bySlug[0]);
  } catch (err) {
    console.error('findOrganizationByPortalSlug (Slug) failed:', err);
    return null;
  }

  try {
    const byPortal = await platformQuery(
      ORGANIZATIONS_TABLE,
      `LOWER({Portal Slug})='${safe}'`,
      1,
    );
    return byPortal[0] ? mapOrganization(byPortal[0]) : null;
  } catch (err) {
    // Unknown field Portal Slug — treat as no match.
    console.error('findOrganizationByPortalSlug (Portal Slug) failed:', err);
    return null;
  }
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

  const fullFields: Record<string, string> = {
    Name: input.name,
    Slug: input.slug,
    Status: 'Active',
    'Portal Slug': input.portalSlug,
    ...(input.clientRecordId ? { 'Client Record Id': input.clientRecordId } : {}),
    ...(input.mission ? { Mission: input.mission } : {}),
    ...(input.industry ? { Industry: input.industry } : {}),
  };

  // Production bases vary — try richest payload first, then strip optional columns.
  const attempts: Record<string, string>[] = [
    fullFields,
    {
      Name: input.name,
      Slug: input.slug,
      Status: 'Active',
      'Portal Slug': input.portalSlug,
    },
    {
      Name: input.name,
      Slug: input.slug,
      Status: 'Active',
    },
    {
      Name: input.name,
      Slug: input.slug,
    },
  ];

  for (const fields of attempts) {
    try {
      const record = await airtableCreate(ORGANIZATIONS_TABLE, fields, true);
      if (record) return mapOrganization(record);
    } catch (err) {
      console.error('createOrganization attempt failed:', err);
    }
  }

  return null;
}

function allowSyntheticOrganizationFallback(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export async function ensureOrganizationForPortal(input: {
  portalSlug: string;
  name: string;
  clientRecordId?: string;
  organizationName?: string;
}): Promise<{ orgId: string; org: Organization | null }> {
  const fallbackId = syntheticOrgId(input.portalSlug);

  if (!platformStoreConfigured()) {
    if (!allowSyntheticOrganizationFallback()) {
      throw new Error('Platform store is required to provision a production organization.');
    }
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

    if (!allowSyntheticOrganizationFallback()) {
      throw new Error(
        `Organization provisioning failed for portal "${input.portalSlug}". Check Organizations table fields (Name, Slug, Status).`,
      );
    }
  } catch (err) {
    console.error('ensureOrganizationForPortal failed:', err);
    if (!allowSyntheticOrganizationFallback()) throw err;
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


/** Optional workspace identity fields on Organizations (Airtable Title Case columns). */
export async function updateOrganizationWorkspaceConfig(
  orgId: string,
  input: {
    platformClientId?: string;
    themeId?: string;
    personalityId?: string;
    workspaceName?: string;
    logo?: string;
    brandColors?: string;
  },
): Promise<Organization | null> {
  if (!platformStoreConfigured() || orgId.startsWith('org_')) return null;

  const fields: Record<string, string> = {};
  if (input.platformClientId !== undefined) fields['Platform Client Id'] = input.platformClientId;
  if (input.themeId !== undefined) fields['Theme Id'] = input.themeId;
  if (input.personalityId !== undefined) fields['Personality Id'] = input.personalityId;
  if (input.workspaceName !== undefined) fields['Workspace Name'] = input.workspaceName;
  if (input.logo !== undefined) fields['Logo'] = input.logo;
  if (input.brandColors !== undefined) fields['Brand Colors'] = input.brandColors;

  if (Object.keys(fields).length === 0) return getOrganizationById(orgId);

  const updated = await platformUpdate(ORGANIZATIONS_TABLE, orgId, fields);
  return updated ? mapOrganization(updated) : null;
}
