import type { NextRequest } from 'next/server';
import { requirePortalSessionFromRequest } from '@/lib/auth/resolve-portal-session';
import { findMembership } from '@/lib/memberships';
import type { BlueprintRecord } from '@/lib/blueprint-store';
import { canAccessBlueprint } from '@/lib/blueprint-ownership';

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
