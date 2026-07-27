import { NextRequest, NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE, signSession, verifySession } from '@/lib/ea-portal-auth';
import { EA_ADMIN_COOKIE, signAdminSession } from '@/lib/ea-admin-auth';
import type { PlatformRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

type Check = { id: string; ok: boolean; detail: string };

function cookieToken(setCookie: string | null, name: string): string | null {
  if (!setCookie) return null;
  const match = setCookie.match(new RegExp(`${name}=([^;]+)`));
  return match?.[1] ?? null;
}

export async function GET(req: NextRequest) {
  const checks: Check[] = [];
  const origin = req.nextUrl.origin;

  const login = await fetch(`${origin}/api/portal/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo@efficiencyarchitects.online',
      password: 'DemoPulse2026!',
      next: '/portal/demo-client',
    }),
    cache: 'no-store',
  });
  const portalToken = cookieToken(login.headers.get('set-cookie'), EA_PORTAL_COOKIE);
  const baseSession = portalToken ? await verifySession(portalToken) : null;
  checks.push({
    id: 'controlled_demo_login',
    ok: login.ok && Boolean(baseSession?.orgId) && baseSession?.slug === 'demo-client',
    detail: `status=${login.status}; slug=${baseSession?.slug ?? 'none'}; persistedOrg=${Boolean(baseSession?.orgId && !baseSession.orgId.startsWith('org_'))}`,
  });

  if (baseSession?.orgId) {
    const roles: PlatformRole[] = ['guest', 'viewer', 'staff', 'admin', 'owner'];
    const itemCounts: Record<string, number> = {};
    for (const role of roles) {
      const token = await signSession({
        slug: baseSession.slug,
        orgId: baseSession.orgId,
        email: baseSession.email,
        role,
      });
      const response = token
        ? await fetch(`${origin}/api/portal/modules`, {
            headers: { Cookie: `${EA_PORTAL_COOKIE}=${token}` },
            cache: 'no-store',
          })
        : null;
      const body = response ? ((await response.json()) as {
        role?: string;
        slug?: string;
        shellNavGroups?: Array<{ items?: unknown[] }>;
      }) : null;
      const count = body?.shellNavGroups?.reduce((sum, group) => sum + (group.items?.length ?? 0), 0) ?? -1;
      itemCounts[role] = count;
      checks.push({
        id: `portal_role_${role}`,
        ok: response?.status === 200 && body?.role === role && body?.slug === baseSession.slug && count >= 0,
        detail: `status=${response?.status ?? 0}; role=${body?.role ?? 'none'}; navItems=${count}`,
      });
    }
    checks.push({
      id: 'portal_role_monotonic_access',
      ok:
        itemCounts.guest <= itemCounts.viewer &&
        itemCounts.viewer <= itemCounts.staff &&
        itemCounts.staff <= itemCounts.admin &&
        itemCounts.admin <= itemCounts.owner,
      detail: JSON.stringify(itemCounts),
    });

    const wrongTenantToken = await signSession({
      slug: baseSession.slug,
      orgId: baseSession.orgId,
      email: baseSession.email,
      role: 'owner',
    });
    const wrongTenant = wrongTenantToken
      ? await fetch(`${origin}/portal/not-the-session-tenant`, {
          headers: { Cookie: `${EA_PORTAL_COOKIE}=${wrongTenantToken}` },
          redirect: 'manual',
          cache: 'no-store',
        })
      : null;
    const location = wrongTenant?.headers.get('location') ?? '';
    checks.push({
      id: 'wrong_tenant_redirect',
      ok: Boolean(wrongTenant && [302, 303, 307, 308].includes(wrongTenant.status) && location.includes(`/portal/${baseSession.slug}`)),
      detail: `status=${wrongTenant?.status ?? 0}; redirectedToSessionTenant=${location.includes(`/portal/${baseSession.slug}`)}`,
    });
  }

  for (const role of ['viewer', 'staff', 'admin', 'owner']) {
    const token = signAdminSession({
      email: `run1-${role}@efficiencyarchitects.online`,
      name: `Run 1 ${role}`,
      role,
      orgId: 'ea',
    });
    const response = await fetch(`${origin}/admin/master`, {
      headers: { Cookie: `${EA_ADMIN_COOKIE}=${token}` },
      redirect: 'manual',
      cache: 'no-store',
    });
    checks.push({
      id: `mcc_role_${role}`,
      ok: response.status === 200,
      detail: `status=${response.status}`,
    });
  }

  const publicLaunch = await fetch(`${origin}/launch`, { redirect: 'manual', cache: 'no-store' });
  checks.push({
    id: 'launch_public_denied',
    ok: [302, 303, 307, 308].includes(publicLaunch.status) &&
      (publicLaunch.headers.get('location') ?? '').includes('/admin/login'),
    detail: `status=${publicLaunch.status}; loginRedirect=${(publicLaunch.headers.get('location') ?? '').includes('/admin/login')}`,
  });

  const failed = checks.filter((check) => !check.ok);
  return NextResponse.json(
    {
      artifact: 'ea-portal-run1-production-certification',
      mode: 'read_only_controlled_fixture',
      ok: failed.length === 0,
      passCount: checks.length - failed.length,
      failCount: failed.length,
      checks,
    },
    { status: failed.length === 0 ? 200 : 409, headers: { 'Cache-Control': 'no-store' } },
  );
}
