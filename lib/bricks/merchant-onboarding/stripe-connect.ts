import 'server-only';
import Stripe from 'stripe';
import type { MerchantConnection } from './contract';

/**
 * Stripe Connect host-side adapter. Caller MUST independently authorize the
 * authenticated portal owner and retrieve a tenant-scoped durable account ID.
 * This adapter does not create a merchant account implicitly on GET.
 */
export type ConnectedAccountStore = {
  get(tenantId: string): Promise<string | null>;
  putIfAbsent(tenantId: string, stripeAccountId: string): Promise<string>;
};

function platformStripe() {
  const expectedPrefix = process.env.VERCEL_ENV === 'production' ? 'sk_live_' : 'sk_test_';
  const preferred = process.env.EA_STRIPE_CONNECT_SECRET_KEY;
  const fallback = process.env.VERCEL_ENV === 'preview' &&
    process.env.EA_STRIPE_CONNECT_USE_EXISTING_TEST_KEY === 'true'
      ? process.env.STRIPE_TEST_SECRET_KEY : undefined;
  // A stale Connect-specific secret must not shadow an enabled, valid preview test key.
  const key = preferred?.startsWith(expectedPrefix) ? preferred : fallback;
  if (!key || !key.startsWith(expectedPrefix))
    throw new Error('Stripe Connect key does not match deployment environment');
  return new Stripe(key);
}

export async function startStripeOnboarding(input: {
  tenantId: string;
  ownerEmail: string;
  returnUrl: string;
  refreshUrl: string;
  store: ConnectedAccountStore;
}): Promise<{ accountId: string; url: string }> {
  const { tenantId, ownerEmail, returnUrl, refreshUrl, store } = input;
  if (!/^[a-z0-9][a-z0-9-_]{1,100}$/i.test(tenantId)) throw new Error('Invalid tenant');
  if (!ownerEmail.includes('@')) throw new Error('Invalid owner');
  const trustedOrigin = process.env.EA_STRIPE_CONNECT_PORTAL_ORIGIN ||
    (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
      ? 'https://' + process.env.VERCEL_URL : undefined);
  if (!trustedOrigin) throw new Error('Trusted portal origin not configured');
  for (const value of [returnUrl, refreshUrl]) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.origin !== trustedOrigin)
      throw new Error('Untrusted return URL');
  }
  const stripe = platformStripe();
  let stage = 'lookup';
  try {
  let accountId = await store.get(tenantId);
  if (!accountId) {
    // Standard onboarding: merchant owns Stripe dashboard and bank relationship.
    stage = 'create_account';
    const created = await stripe.accounts.create({
      type: 'standard',
      country: 'US',
      email: ownerEmail,
      capabilities: { transfers: { requested: true }, card_payments: { requested: true } },
      metadata: { ea_tenant_id: tenantId },
    }, { idempotencyKey: 'ea-connect-create-' + tenantId });
    // Atomic insert prevents reassignment in concurrent requests.
    stage = 'save_mapping';
    accountId = await store.putIfAbsent(tenantId, created.id);
    if (accountId !== created.id) throw new Error('Concurrent account mapping changed; retry onboarding');
  }
  stage = 'retrieve_account';
  const account = await stripe.accounts.retrieve(accountId);
  if (account.metadata?.ea_tenant_id !== tenantId || account.type !== 'standard')
    throw new Error('Connected account tenant or type mismatch');
  stage = 'create_link';
  const link = await stripe.accountLinks.create({
    account: accountId, type: 'account_onboarding',
    refresh_url: refreshUrl, return_url: returnUrl,
  });
  return { accountId, url: link.url };
  } catch (error) {
    if (tenantId === 'tarris-sandbox' && process.env.VERCEL_ENV === 'preview') {
      const stripeType = error && typeof error === 'object' && 'type' in error && typeof error.type === 'string' ? error.type : 'unknown';
      console.error('TB3_SANDBOX_CONNECT_STAGE', {stage, stripeType});
      throw new Error('TB3_SANDBOX_STAGE_' + stage);
    }
    throw error;
  }
}

export async function getStripeMerchantStatus(
  tenantId: string,
  store: Pick<ConnectedAccountStore, 'get'>,
): Promise<MerchantConnection> {
  const accountId = await store.get(tenantId);
  const empty: MerchantConnection = {
    tenantId, provider: 'stripe', status: 'not_connected',
    providerMerchantReference: null, verifiedAt: null,
    chargesEnabled: false, payoutsEnabled: false,
  };
  if (!accountId) return empty;
  const account = await platformStripe().accounts.retrieve(accountId);
  if (account.metadata?.ea_tenant_id !== tenantId || account.type !== 'standard')
    throw new Error('Connected account tenant or type mismatch');
  const chargesEnabled = account.charges_enabled ?? false;
  const payoutsEnabled = account.payouts_enabled ?? false;
  const pending = (account.requirements?.currently_due?.length ?? 0) > 0
    || (account.requirements?.past_due?.length ?? 0) > 0;
  const restricted = account.requirements?.disabled_reason != null;
  return {
    tenantId, provider: 'stripe',
    status: restricted ? 'restricted'
      : chargesEnabled && payoutsEnabled && !pending && account.details_submitted
        ? 'ready'
        : pending ? 'verification_required' : 'pending_provider',
    providerMerchantReference: accountId,
    // A live API read is a verification, never infer readiness from a return redirect.
    verifiedAt: new Date().toISOString(),
    chargesEnabled, payoutsEnabled,
  };
}
