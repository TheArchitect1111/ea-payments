/**
 * Subscription plans ? derived from @ea/payments-contract.
 */

import type Stripe from 'stripe';
import type { PortalConfig } from '@/lib/catalog';
import type { ModuleId } from '@/lib/modules/registry';
import { listCommerceOffers, type CommerceOffer } from '@ea/payments-contract';

export type SubscriptionPlanId =
  | 'simplifi_monthly'
  | 'simplifi_annual'
  | 'platform_monthly'
  | 'platform_annual';

export type SubscriptionInterval = 'month' | 'year';

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  displayName: string;
  description: string;
  interval: SubscriptionInterval;
  priceCents: number;
  stripePriceEnvKey: string;
  allowInlineStripePrice?: boolean;
  trialDays?: number;
  airtablePackageName: 'Simplifi' | 'Implementation Package';
  moduleIds: ModuleId[];
  portalConfig?: PortalConfig;
};

function toSubscriptionPlan(offer: CommerceOffer): SubscriptionPlan | null {
  if (offer.kind !== 'subscription' || !offer.interval) return null;
  return {
    id: offer.id as SubscriptionPlanId,
    name: offer.name,
    displayName: offer.displayName,
    description: offer.description,
    interval: offer.interval,
    priceCents: offer.priceCents,
    stripePriceEnvKey: offer.stripePriceEnvKey,
    allowInlineStripePrice: offer.allowInlineStripePrice,
    trialDays: offer.trialDays,
    airtablePackageName: offer.airtablePackageName as
      | 'Simplifi'
      | 'Implementation Package',
    moduleIds: [...offer.moduleIds] as ModuleId[],
    portalConfig: offer.portalConfig,
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = listCommerceOffers('subscription')
  .map(toSubscriptionPlan)
  .filter((plan): plan is SubscriptionPlan => Boolean(plan));

const PLAN_BY_ID = new Map(SUBSCRIPTION_PLANS.map((p) => [p.id, p]));

export function getSubscriptionPlan(id: string): SubscriptionPlan | undefined {
  return PLAN_BY_ID.get(id as SubscriptionPlanId);
}

export function isSubscriptionPlanPurchasable(plan: SubscriptionPlan): boolean {
  if (plan.allowInlineStripePrice && plan.priceCents > 0) return true;
  const priceId = process.env[plan.stripePriceEnvKey];
  return plan.priceCents > 0 && Boolean(priceId);
}

export function getPurchasableSubscriptionPlans(): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS.filter(isSubscriptionPlanPurchasable);
}

export function formatSubscriptionPrice(plan: SubscriptionPlan): string {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(plan.priceCents / 100);
  return plan.interval === 'month' ? `${amount}/mo` : `${amount}/yr`;
}

export function subscriptionStatusIsActive(status: string): boolean {
  return status === 'active' || status === 'trialing';
}

/** Resolve subscription id from Stripe Invoice (API versions vary). */
export function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | undefined {
  const legacy = (invoice as Stripe.Invoice & { subscription?: string | { id?: string } })
    .subscription;
  if (typeof legacy === 'string') return legacy;
  if (legacy && typeof legacy === 'object' && legacy.id) return legacy.id;

  const parentSub = invoice.parent?.subscription_details?.subscription;
  if (typeof parentSub === 'string') return parentSub;
  if (parentSub && typeof parentSub === 'object' && parentSub.id) return parentSub.id;

  return undefined;
}
