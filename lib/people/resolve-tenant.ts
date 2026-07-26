/**
 * INV-1 — resolve tenant organization exclusively from portal slug.
 * Never trust request-body organizationId.
 */
import {
  findOrganizationByPortalSlug,
  type Organization,
} from '@/lib/organizations';

export type ResolvedPeopleTenant = {
  organizationId: string;
  portalSlug: string;
  organization: Organization | null;
};

/**
 * For tests / local: allow PEOPLE_TEST_ORG_MAP_JSON={"slug":"orgId"} without Airtable.
 */
function orgIdFromTestMap(slug: string): string | null {
  const raw = process.env.PEOPLE_TEST_ORG_MAP_JSON?.trim();
  if (!raw) return null;
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    return map[slug.trim().toLowerCase()]?.trim() || null;
  } catch {
    return null;
  }
}

export async function resolvePeopleTenantFromSlug(
  portalSlug: string,
): Promise<ResolvedPeopleTenant | null> {
  const slug = portalSlug.trim().toLowerCase();
  if (!slug) return null;

  const testOrg = orgIdFromTestMap(slug);
  if (testOrg) {
    return { organizationId: testOrg, portalSlug: slug, organization: null };
  }

  try {
    const organization = await findOrganizationByPortalSlug(slug);
    if (organization?.id && !organization.id.startsWith('org_')) {
      return {
        organizationId: organization.id,
        portalSlug: slug,
        organization,
      };
    }
    // Durable org missing — allow demo/test synthetic only when not production
    if (organization?.id && process.env.NODE_ENV !== 'production') {
      return {
        organizationId: organization.id,
        portalSlug: slug,
        organization,
      };
    }
  } catch {
    // fall through
  }

  // Demo fallback for local certification without Airtable
  if (process.env.NODE_ENV !== 'production' || process.env.PEOPLE_ALLOW_SLUG_ORG_FALLBACK === '1') {
    return {
      organizationId: `people_org_${slug}`,
      portalSlug: slug,
      organization: null,
    };
  }

  return null;
}

/** Strip and ignore body organizationId (ADV-1). */
export function ignoreBodyOrganizationId<T extends Record<string, unknown>>(
  body: T,
): Omit<T, 'organizationId'> {
  const rest = { ...body };
  delete rest.organizationId;
  return rest as Omit<T, 'organizationId'>;
}
