import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { findMembership } from '@/lib/memberships';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import type { PortalApiSession } from '@/lib/api/portal-route';

/** A signed role alone is not permission to operate Amanda's records. */
export async function amandaStaffOrganization(session: PortalApiSession) {
  if (session.slug !== 'amanda-catherine' || !session.email || !roleAtLeast(normalizeRole(session.role), 'staff')) return null;
  const organization = await findOrganizationByPortalSlug('amanda-catherine');
  if (!organization || organization.id.startsWith('org_')) return null;
  const membership = await findMembership(session.email, organization.id);
  return membership?.status === 'active' && roleAtLeast(membership.role, 'staff') ? organization : null;
}
