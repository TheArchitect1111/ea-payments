import { getClientByPortalSlug } from '@/lib/airtable';
import { ensureOwnerMembership } from '@/lib/memberships';
import { ensureOrganizationForPortal } from '@/lib/organizations';
import { ensurePackageEntitlements } from '@/lib/modules/portal-modules';
import type { PlatformRole } from '@/lib/rbac';
import { EA_INTERNAL_ORG_ID } from '@/lib/platform-store';
import { normalizeAdminRole } from '@/lib/rbac';

export type PortalIdentity = {
  orgId: string;
  role: PlatformRole;
  email: string;
};

/** Resolve org + role for a portal login; creates org/membership on first login. */
export async function resolvePortalIdentity(input: {
  email: string;
  slug: string;
  clientRecordId?: string;
}): Promise<PortalIdentity> {
  const email = input.email.trim().toLowerCase();

  let clientName = input.slug;
  let organizationName: string | undefined;
  let packagePurchased = 'Capacity Assessment';
  let commerceOfferId: string | undefined;

  try {
    const client = await getClientByPortalSlug(input.slug);
    if (client) {
      clientName = client.clientName || clientName;
      organizationName = client.organization;
      packagePurchased = client.packagePurchased;
      commerceOfferId = client.commerceOfferId;
    }
  } catch {
    // Non-fatal — proceed with slug as name
  }

  const { orgId } = await ensureOrganizationForPortal({
    portalSlug: input.slug,
    name: clientName,
    clientRecordId: input.clientRecordId,
    organizationName,
  });

  const { role } = await ensureOwnerMembership({
    userEmail: email,
    organizationId: orgId,
  });

  void ensurePackageEntitlements({
    orgId,
    packagePurchased,
    commerceOfferId,
    slug: input.slug,
  });

  return { orgId, role, email };
}

/** EA internal admin identity — single org for all admin users. */
export function resolveAdminIdentity(input: {
  email: string;
  role: string;
}): PortalIdentity {
  return {
    orgId: EA_INTERNAL_ORG_ID,
    role: normalizeAdminRole(input.role),
    email: input.email.trim().toLowerCase(),
  };
}
