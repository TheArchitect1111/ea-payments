/**
 * Subscription plans for the EA Platform Chassis billing engine (Phase 3).
 * Maps Stripe subscriptions → module entitlements.
 */

import type Stripe from 'stripe';
import type { PortalConfig } from '@/lib/catalog';
import type { ModuleId } from '@/lib/modules/registry';
import { TENANT_MODULE_PRESETS } from '@/lib/modules/registry';

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

const SIMPLIFI_MODULES: ModuleId[] = [
  'dashboard',
  'pulse',
  'simplifi',
  'amplifi',
  'update-hub',
  'messaging',
  'documents',
  'training',
  'events',
  'resources',
  'ask',
  'billing',
];

const PLATFORM_MODULES: ModuleId[] = TENANT_MODULE_PRESETS['ea-client'];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'simplifi_monthly',
    name: 'Simplifi Monthly',
    displayName: 'Simplifi™ — Monthly',
    description:
      'Personal Opportunity Intelligence: capture, analyze, and act on opportunities. Billed monthly.',
    interval: 'month',
    priceCents: 14900,
    stripePriceEnvKey: 'STRIPE_PRICE_SIMPLIFI_MONTHLY',
    allowInlineStripePrice: true,
    trialDays: 14,
    airtablePackageName: 'Simplifi',
    moduleIds: SIMPLIFI_MODULES,
    portalConfig: { platform: 'efficiency-architects', loginPath: '/portal/login' },
  },
  {
    id: 'simplifi_annual',
    name: 'Simplifi Annual',
    displayName: 'Simplifi™ — Annual',
    description:
      'Same Simplifi™ capabilities with annual billing (save vs monthly).',
    interval: 'year',
    priceCents: 149000,
    stripePriceEnvKey: 'STRIPE_PRICE_SIMPLIFI_ANNUAL',
    allowInlineStripePrice: true,
    trialDays: 14,
    airtablePackageName: 'Simplifi',
    moduleIds: SIMPLIFI_MODULES,
    portalConfig: { platform: 'efficiency-architects', loginPath: '/portal/login' },
  },
  {
    id: 'platform_monthly',
    name: 'EA Platform Monthly',
    displayName: 'EA Platform — Monthly',
    description: 'Full client operating system: Pulse, Simplifi, Amplifi, and core modules.',
    interval: 'month',
    priceCents: 49700,
    stripePriceEnvKey: 'STRIPE_PRICE_PLATFORM_MONTHLY',
    trialDays: 7,
    airtablePackageName: 'Implementation Package',
    moduleIds: [...PLATFORM_MODULES, 'billing'],
    portalConfig: { platform: 'efficiency-architects', loginPath: '/portal/login' },
  },
  {
    id: 'platform_annual',
    name: 'EA Platform Annual',
    displayName: 'EA Platform — Annual',
    description: 'Full EA Platform bundle with annual billing.',
    interval: 'year',
    priceCents: 497000,
    stripePriceEnvKey: 'STRIPE_PRICE_PLATFORM_ANNUAL',
    trialDays: 7,
    airtablePackageName: 'Implementation Package',
    moduleIds: [...PLATFORM_MODULES, 'billing', 'connect'],
    portalConfig: { platform: 'efficiency-architects', loginPath: '/portal/login' },
  },
];

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
