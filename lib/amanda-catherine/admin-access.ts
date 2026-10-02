import { guardPortalApi } from '@/lib/api/portal-route';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { findMembership } from '@/lib/memberships';
import type { NextRequest } from 'next/server';
export async function guardAmandaAdmin(req: NextRequest) {
  const auth = await guardPortalApi(req, { slug: 'amanda-catherine' });
  if (!auth.ok) return auth;
  const { session } = auth;
  if (!session.email || !session.orgId || session.orgId.startsWith('org_') || !roleAtLeast(normalizeRole(session.role), 'admin')) return { ok: false as const, status: 403, error: 'Amanda administrator access required.' };
  const member = await findMembership(session.email, session.orgId);
  if (!member || member.status !== 'active' || !roleAtLeast(normalizeRole(member.role), 'admin')) return { ok: false as const, status: 403, error: 'Amanda administrator membership required.' };
  return auth;
}
