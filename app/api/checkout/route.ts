import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

const PRICES: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER_49 || 'price_starter_49',
  growth: process.env.STRIPE_PRICE_GROWTH_99 || 'price_growth_99',
  scale: process.env.STRIPE_PRICE_SCALE_199 || 'price_scale_199',
};

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get('plan') || 'starter';
  const priceId = PRICES[plan] || PRICES.starter;
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://ea-payments.vercel.app'}/success?plan=${plan}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://ea-payments.vercel.app'}/free-campaign-preview?canceled=1`,
    allow_promotion_codes: true,
  });
  
  return NextResponse.redirect(session.url!, 303);
}
