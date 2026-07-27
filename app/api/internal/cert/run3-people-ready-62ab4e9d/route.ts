import { NextRequest, NextResponse } from 'next/server';
import { signSession } from '@/lib/ea-portal-auth';
import { guardPeopleApi } from '@/lib/people/guard';
import {
  isUniversalPeopleEnabled,
  isUniversalPeopleMigrateEnabled,
  isUniversalPeoplePersistEnabled,
} from '@/lib/people/flags';
import { resolvePeopleTenantFromSlug } from '@/lib/people/resolve-tenant';

export const dynamic = 'force-dynamic';

export async function GET() {
  const slug = 'demo-website';
  const tenant = await resolvePeopleTenantFromSlug(slug);
  if (!tenant) {
    return NextResponse.json({ ok: false, step: 'tenant' }, { status: 503 });
  }

  const token = await signSession({
    slug,
    orgId: tenant.organizationId,
    role: 'staff',
    email: 'run3-cert@efficiencyarchitects.online',
  });
  if (!token) {
    return NextResponse.json({ ok: false, step: 'session' }, { status: 503 });
  }

  const request = new NextRequest(
    `https://ea-payments.vercel.app/api/portal/${slug}/people`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-EA-Realm': 'portal',
      },
    },
  );
  const guarded = await guardPeopleApi(request, slug);
  if (!guarded.ok) {
    return NextResponse.json(
      { ok: false, step: 'guard', status: guarded.response.status },
      { status: 503 },
    );
  }

  const people = await guarded.ctx.repository.listPersonsByOrg(
    guarded.ctx.organizationId,
  );

  return NextResponse.json({
    ok: true,
    peopleEnabled: isUniversalPeopleEnabled(),
    persistEnabled: isUniversalPeoplePersistEnabled(),
    migrationEnabled: isUniversalPeopleMigrateEnabled(),
    repository: guarded.ctx.repository.kind,
    tenantResolved: true,
    readSucceeded: Array.isArray(people),
  });
}
