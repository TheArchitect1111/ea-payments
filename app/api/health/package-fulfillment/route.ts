import { NextResponse } from 'next/server';
import { getPurchasableEACatalog } from '@/lib/catalog';
import { buildPackageFulfillmentPlan } from '@/lib/package-fulfillment';

export const dynamic = 'force-dynamic';

const REQUIRED_PRODUCT_IDS = ['landing_page', 'client_portal', 'connect_profile'] as const;

export async function GET() {
  const purchasable = getPurchasableEACatalog();
  const packages = REQUIRED_PRODUCT_IDS.map((id) => {
    const item = purchasable.find((product) => product.id === id);
    const plan = item ? buildPackageFulfillmentPlan(item) : null;
    return {
      id,
      configured: Boolean(item),
      displayName: item?.displayName,
      priceCents: item?.priceCents,
      checkoutPath: item ? `/checkout?package=${item.id}` : null,
      fulfillment: plan,
    };
  });

  const env = {
    stripeSecret: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    airtable: Boolean(process.env.AIRTABLE_API_KEY),
    resend: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    onboardingWebhook: Boolean(process.env.ONBOARDING_WEBHOOK_URL),
  };

  const blockers = [
    !env.stripeSecret && 'STRIPE_SECRET_KEY is required to create checkout sessions.',
    !env.stripeWebhookSecret && 'STRIPE_WEBHOOK_SECRET is required for Stripe payment completion automation.',
    !env.airtable && 'AIRTABLE_API_KEY is required to create client records and portal credentials.',
    !env.resend && 'RESEND_API_KEY and RESEND_FROM_EMAIL are required to send client/admin emails.',
    !env.onboardingWebhook && 'ONBOARDING_WEBHOOK_URL is required to trigger external fulfillment automation.',
  ].filter(Boolean);

  return NextResponse.json({
    ok: packages.every((item) => item.configured) && blockers.length === 0,
    packagesReady: packages.every((item) => item.configured),
    automationReady: blockers.length === 0,
    packages,
    env,
    blockers,
    reviewGate: true,
  });
}
