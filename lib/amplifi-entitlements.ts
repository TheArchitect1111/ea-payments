import { AMPLIFI_PLANS, type AmplifiPlanId, type AmplifiPlan } from '@/lib/amplifi-plans';

export type AmplifiCapability = keyof AmplifiPlan['capabilities'];
export type AmplifiUsageKind = 'post' | 'series' | 'campaign' | 'watchedSubject';

const PAID_PLAN_MAP: Record<string, AmplifiPlanId> = {
  amplifi_social: 'social',
  amplifi_intelligence: 'intelligence',
  amplifi_complete: 'complete',
  starter: 'starter', social: 'social', intelligence: 'intelligence', complete: 'complete',
};

export function normalizeAmplifiPlanId(plan?: string | null): AmplifiPlanId {
  return PAID_PLAN_MAP[String(plan || '').toLowerCase()] || 'starter';
}

export function getAmplifiEntitlements(plan?: string | null) {
  const planId = normalizeAmplifiPlanId(plan);
  return { planId, plan: AMPLIFI_PLANS[planId], capabilities: AMPLIFI_PLANS[planId].capabilities, limits: AMPLIFI_PLANS[planId].limits };
}

export function requireAmplifiCapability(plan: string | null | undefined, capability: AmplifiCapability) {
  const entitlement = getAmplifiEntitlements(plan);
  return { ...entitlement, allowed: entitlement.capabilities[capability] };
}

export function amplifiUsageLimit(plan: string | null | undefined, kind: AmplifiUsageKind): number | null {
  const { limits } = getAmplifiEntitlements(plan);
  if (kind === 'post') return limits.postsPerMonth;
  if (kind === 'series') return limits.seriesPerMonth;
  if (kind === 'campaign') return limits.campaignsPerMonth;
  return limits.watchedSubjects;
}

export function amplifiUsageAllowed(plan: string | null | undefined, kind: AmplifiUsageKind, used: number) {
  const limit = amplifiUsageLimit(plan, kind);
  return { allowed: limit === null || used < limit, limit, used, remaining: limit === null ? null : Math.max(0, limit - used) };
}
