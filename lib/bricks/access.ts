import type { NextRequest } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { findMembership } from '@/lib/memberships';
import { isModuleEnabled } from '@/lib/modules/portal-modules';
import { PLATFORM_ROLES, roleAtLeast, type PlatformRole } from '@/lib/rbac';
import type { ModuleId } from '@/lib/modules/registry';
export async function guardBrick(req: NextRequest, slug: string, moduleId: ModuleId, minimum: PlatformRole = 'guest') {
  const auth = await guardPortalApi(req, { slug });
  if (!auth.ok) return { ok: false as const, response: portalApiUnauthorized(auth) };
  const session = auth.session;
  const org = await findOrganizationByPortalSlug(slug);
  const member = session.email && org ? await findMembership(session.email, org.id) : null;
  if (!org || !/^rec[a-zA-Z0-9]+$/.test(org.id) || session.orgId !== org.id || !session.email ||
      !session.role || !PLATFORM_ROLES.includes(session.role) || !roleAtLeast(session.role, minimum) ||
      member?.status !== 'active' || !roleAtLeast(member.role, minimum) ||
      !await isModuleEnabled({ orgId: org.id, slug, moduleId, role: session.role }))
    return { ok: false as const, response: Response.json({ error: 'Portal access denied.' }, { status: 403 }) };
  return { ok: true as const, tenant: { organizationId: org.id, portalSlug: slug }, session };
}
export function requireSameOrigin(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) throw new Error('Same-origin request required');
}
