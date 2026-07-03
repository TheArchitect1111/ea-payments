/**
 * EA tenant identifiers — canonical contract for multi-tenant routing.
 *
 * - portalSlug: URL segment `/portal/{slug}` and session.slug (client-facing)
 * - organizationId: platform identity for entitlements, memberships, events
 *
 * Provisioned together on login via lib/org-provision.ts.
 */

export type TenantContext = {
  portalSlug: string;
  organizationId: string;
};

export function resolvePortalSlugForOrg(
  organizationId: string,
  fallbackSlug?: string,
): string {
  const envSlug = process.env.CREATIVE_STUDIO_PORTAL_SLUG?.trim();
  if (organizationId === 'ea' && envSlug) return envSlug;
  return fallbackSlug ?? organizationId;
}

export function isSyntheticOrganizationId(organizationId: string): boolean {
  return organizationId.startsWith('org_');
}

export function syntheticOrganizationId(portalSlug: string): string {
  return `org_${portalSlug}`;
}

/** Prefer organizationId for platform events; portalSlug for client-scoped data. */
export function tenantFromSession(input: {
  slug: string;
  orgId?: string;
}): TenantContext {
  return {
    portalSlug: input.slug,
    organizationId: input.orgId?.trim() || syntheticOrganizationId(input.slug),
  };
}
