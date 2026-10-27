import Stripe from "stripe";

function getStripeForTenant() {
  const key = process.env.TB3_STRIPE_SECRET_KEY;
  if (!key) throw new Error("TB3_STRIPE_SECRET_KEY missing - set in Vercel Env");
  return new Stripe(key, { apiVersion: "2024-06-20" as any });
}

export type DirectVerifyResult = {
  accountId: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  ready: boolean;
  raw: Stripe.Account;
};

export async function verifyDirectAccount(accountId: string): Promise<DirectVerifyResult> {
  if (!accountId || !accountId.startsWith("acct_")) {
    throw new Error("Invalid account ID - must start with acct_");
  }
  const stripe = getStripeForTenant();
  const account = await stripe.accounts.retrieve(accountId);
  return {
    accountId: account.id,
    charges_enabled: !!account.charges_enabled,
    payouts_enabled: !!account.payouts_enabled,
    details_submitted: !!account.details_submitted,
    ready: Boolean(account.charges_enabled && account.payouts_enabled),
    raw: account,
  };
}

export async function getDirectAccountStatus(accountId: string) {
  return verifyDirectAccount(accountId);
}
