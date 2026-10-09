import type { NextRequest } from 'next/server';
import { requireAdminActionFromRequest, requireAdminSessionFromRequest } from '@/lib/admin-session-guard';
import type { PlatformAction } from '@/lib/rbac';

type HqAuthResult =
  | { ok: true; user: { email: string; name: string; role: string; orgId?: string }; client: boolean }
  | { ok: false; status: number; error: string };

export async function authorizeHqRequest(
  req: NextRequest,
  action: PlatformAction,
  options: { clientProjectId?: string; allowClientContent?: boolean } = {},
): Promise<HqAuthResult> {
  const session = await requireAdminSessionFromRequest(req);
  if (!session.ok) return session;
  if (session.user.role.toLowerCase() === 'client') {
    const allowed = req.nextUrl.searchParams.get('role') === 'client'
      && Boolean(options.clientProjectId)
      && session.user.orgId === options.clientProjectId
      && (action === 'admin:access' || (options.allowClientContent && action === 'admin:manage'));
    if (!allowed) return { ok: false, status: 403, error: 'This client session cannot access that HQ action.' };
    return { ok: true, user: session.user, client: true };
  }
  const authorized = await requireAdminActionFromRequest(req, action);
  if (!authorized.ok) return authorized;
  return { ok: true, user: authorized.user, client: false };
}
