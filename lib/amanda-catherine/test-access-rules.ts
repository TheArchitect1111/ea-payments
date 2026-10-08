/**
 * Pure test-access rules, used by Stripe fulfillment, learner authorization and cron.
 * UTC time is derived from the immutable Stripe session creation timestamp.
 */
export type AmandaCourseEntitlement = {
  isTestAccess: boolean;
  testPaidAt: string | null;
  expiresAt: string | null;
  stripeSessionId?: string;
  status?: 'active' | 'expired';
};

export function amandaTrialFromStripeSession(session: {
  id: string; created: number; metadata?: Record<string, string> | null;
}, courseId?: string | null): AmandaCourseEntitlement | null {
  if (!courseId || session.metadata?.paymentOption !== 'test' ||
      session.metadata?.privateTestCheckout !== 'true') return null;
  if (!Number.isSafeInteger(session.created) || session.created <= 0) throw new Error('Valid Stripe session.created is required');
  const testPaidAt = new Date(session.created * 1000).toISOString();
  const expiresAt = new Date((session.created + 72 * 60 * 60) * 1000).toISOString();
  return { isTestAccess: true, testPaidAt, expiresAt, stripeSessionId: session.id, status: 'active' };
}

export function resolveAmandaEntitlement(
  existing: AmandaCourseEntitlement | undefined,
  purchase: AmandaCourseEntitlement,
  legacyPermanent = false,
): AmandaCourseEntitlement | undefined {
  if (purchase.isTestAccess) {
    // Never downgrade permanent purchases or extend/restart an existing trial.
    if (legacyPermanent || (existing && !existing.isTestAccess && !existing.expiresAt)) return existing;
    if (existing?.isTestAccess && existing.expiresAt) return existing;
  }
  return purchase;
}

export function amandaTrialExpired(grant: AmandaCourseEntitlement | undefined, nowMs = Date.now()) {
  if (!grant?.isTestAccess) return false;
  if (grant.status === 'expired') return true;
  // Invalid expiry is denied instead of granting perpetual test access.
  if (!grant.expiresAt) return true;
  const timestamp = Date.parse(grant.expiresAt);
  return !Number.isFinite(timestamp) || timestamp <= nowMs;
}

export function amandaEntitlementStatus(grant: AmandaCourseEntitlement | undefined, nowMs = Date.now()) {
  return amandaTrialExpired(grant, nowMs) ? 'expired' : 'active';
}
