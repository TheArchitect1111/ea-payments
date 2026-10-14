import { resolvePortalSession } from '@/lib/auth/resolve-portal-session';
import { findMembership } from '@/lib/memberships';
import { getOrganizationById } from '@/lib/organizations';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { TB3_ORGANIZATION_ID, TB3_PORTAL_SLUG, hasTb3Identity } from './contracts';
export async function canTrackPaidAccess() {
  const admin = await resolvePortalSession({ realm: 'admin' });
  if (admin?.email && roleAtLeast(normalizeRole(admin.role), 'admin')) return true;
  const portal = await resolvePortalSession({ realm: 'portal' });
  if (!hasTb3Identity(portal) || !portal?.email || !roleAtLeast(normalizeRole(portal.role), 'owner')) return false;
  const [membership, org] = await Promise.all([findMembership(portal.email, TB3_ORGANIZATION_ID), getOrganizationById(TB3_ORGANIZATION_ID)]);
  return Boolean(org?.status === 'Active' && org.portalSlug === TB3_PORTAL_SLUG && membership?.status === 'active' && roleAtLeast(normalizeRole(membership.role), 'owner'));
}
