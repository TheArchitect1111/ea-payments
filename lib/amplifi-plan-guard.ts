import type { PortalApiSession } from '@/lib/api/portal-route';
import { findOrganizationByPortalSlug, getOrganizationById } from '@/lib/organizations';
import { getAmplifiEntitlements, requireAmplifiCapability, type AmplifiCapability } from '@/lib/amplifi-entitlements';

export async function resolveAmplifiPlanForSession(session: PortalApiSession) {
  const org = session.orgId && !session.orgId.startsWith('org_')
    ? await getOrganizationById(session.orgId)
    : await findOrganizationByPortalSlug(session.slug);
  return getAmplifiEntitlements(org?.subscriptionPlanId || 'starter');
}

export async function guardAmplifiCapability(session: PortalApiSession, capability: AmplifiCapability) {
  const entitlements = await resolveAmplifiPlanForSession(session);
  return { ...requireAmplifiCapability(entitlements.planId, capability), subscriptionStatus: undefined };
}
