import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get('plan') || 'starter').toLowerCase();
  const map: Record<string, string> = {
    starter: process.env.STRIPE_PRICE_STARTER_49 || 'price_1UU5qUGW696TMAaAL761Fq3H',
    growth: process.env.STRIPE_PRICE_GROWTH_99 || 'price_1UU5qXGW696TMAaAqQuzM2Lg',
    scale: process.env.STRIPE_PRICE_SCALE_199 || 'price_1UU5qZGW696TMAaARGZO8h64',
    pro: process.env.STRIPE_PRICE_SCALE_199 || 'price_1UU5qZGW696TMAaARGZO8h64',
  };
  const plan = map[raw] ? (raw === 'pro' ? 'scale' : raw) : 'starter';
  const priceId = map[raw] || map['starter'];

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }
  if (!priceId) {
    return NextResponse.json({ error: 'Price ID not configured for '+plan }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as any });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ea-payments.vercel.app';
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/success?plan=${plan}`,
    cancel_url: `${baseUrl}/free-campaign-preview?canceled=1`,
    allow_promotion_codes: true,
  });
  return NextResponse.redirect(session.url!, 303);
}
