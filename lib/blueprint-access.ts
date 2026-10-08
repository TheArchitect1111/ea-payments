import type { NextRequest } from 'next/server';
import { requirePortalSessionFromRequest } from '@/lib/auth/resolve-portal-session';
import { findMembership, type Membership } from '@/lib/memberships';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import type { BlueprintRecord } from '@/lib/blueprint-store';

export type BlueprintActor = { slug?: string; orgId?: string; email?: string; role?: string };

/** No legacy/unowned blueprint or synthetic tenant can be authorized by a URL identifier. */
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

/** Server-side session and durable membership must agree before any GET/PATCH/POST. */
export async function authorizeBlueprintRequest(req: NextRequest, record: BlueprintRecord) {
  const session = await requirePortalSessionFromRequest(req);
  if (!session) return { ok: false as const, status: 401, error: 'Authentication required.' };
  try {
    const membership = session.email && session.orgId
      ? await findMembership(session.email, session.orgId)
      : null;
    if (canAccessBlueprint(session, record, membership)) return { ok: true as const };
  } catch {
    // Persistence outage is never permission to access another tenant.
  }
  return { ok: false as const, status: 403, error: 'Blueprint access denied.' };
}
