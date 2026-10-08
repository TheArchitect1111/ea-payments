import type { BlueprintRecord } from '@/lib/blueprint-store';
import type { Membership } from '@/lib/memberships';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';

export type BlueprintActor = { slug?: string; orgId?: string; email?: string; role?: string };

/** Pure, fail-closed tenant/role/membership policy, suitable for exhaustive unit tests. */
export function canAccessBlueprint(
  actor: BlueprintActor | null,
  record: BlueprintRecord,
  membership: Membership | null,
): boolean {
  if (!actor?.email || !actor.orgId || !actor.slug) return false;
  if (!record.ownerOrgId || !record.ownerPortalSlug) return false;
  if (actor.orgId.startsWith('org_') || record.ownerOrgId.startsWith('org_')) return false;
  if (actor.orgId !== record.ownerOrgId || actor.slug !== record.ownerPortalSlug) return false;
  if (!roleAtLeast(normalizeRole(actor.role), 'admin')) return false;
  if (!membership || membership.status !== 'active') return false;
  if (membership.organizationId !== record.ownerOrgId) return false;
  if (membership.userEmail.toLowerCase() !== actor.email.toLowerCase()) return false;
  return roleAtLeast(membership.role, 'admin');
}
