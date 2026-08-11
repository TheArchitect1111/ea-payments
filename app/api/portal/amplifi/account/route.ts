import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { getClientByPortalSlug } from '@/lib/airtable';
import { getOrganizationById } from '@/lib/organizations';
import { resolveAmplifiPlan } from '@/lib/amplifi/plan-entitlements';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);

  const [org, client] = await Promise.all([
    getOrganizationById(tenant.organizationId),
    getClientByPortalSlug(tenant.portalSlug),
  ]);

  const planId = org?.subscriptionPlanId || client?.commerceOfferId || null;
  const plan = resolveAmplifiPlan(planId);

  return NextResponse.json({
    ok: true,
    account: {
      portalSlug: tenant.portalSlug,
      organizationId: tenant.organizationId,
      subscriptionStatus: org?.subscriptionStatus || null,
      ...plan,
    },
  });
}
