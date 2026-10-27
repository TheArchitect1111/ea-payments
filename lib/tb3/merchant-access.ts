import { requirePortalSession } from '@/lib/auth/resolve-portal-session';
import { findMembership } from '@/lib/memberships';
import { getOrganizationById } from '@/lib/organizations';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { TB3_ORGANIZATION_ID, TB3_PORTAL_SLUG, hasTb3Identity } from '@/lib/tb3/contracts';

/** One authorization rule for the TB3 merchant page AND its Stripe API.
 * No implicit EA-admin access and no owner role inferred from the URL.
 */
export async function requireTb3MerchantSession() {
  const session = await requirePortalSession({ realm: 'portal' });
  if (!session || !hasTb3Identity(session) || !session.email ||
      !roleAtLeast(normalizeRole(session.role), 'admin')) return null;
  const [member, org] = await Promise.all([
    findMembership(session.email, TB3_ORGANIZATION_ID),
    getOrganizationById(TB3_ORGANIZATION_ID),
  ]);
  if (org?.status !== 'Active' || org.portalSlug !== TB3_PORTAL_SLUG ||
      member?.status !== 'active' ||
      !roleAtLeast(normalizeRole(member.role), 'admin')) return null;
  return session;
}
