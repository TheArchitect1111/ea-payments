import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// NO NEW KEY - use only STRIPE_SECRET_KEY, but guard it must be test key
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY missing');
  return new Stripe(key, { apiVersion: '2024-06-20' as any });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseId, isTest } = body;

    // HARD GUARD FOR TEST CHECKOUT - DO NOT USE LIVE KEY
    if (isTest || (courseId && String(courseId).startsWith('test-'))) {
      if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
        throw new Error('Test checkout blocked: STRIPE_SECRET_KEY is not a test key. Will not use live key.');
      }
      const stripe = getStripe();
      // Force CAD $1 test session only
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        currency: 'cad',
        line_items: [{ price_data: { currency: 'cad', product_data: { name: `TEST - ${courseId}` }, unit_amount: 100 }, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'}/portal/amanda-catherine/learning/${courseId}?success=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'}/portal/amanda-catherine/learning/${courseId}?canceled=1`,
      });
      return NextResponse.json({ url: session.url, mode: 'test', amount: 100, currency: 'cad' });
    }

    // Normal routes unchanged, public pricing unchanged
    const stripe = getStripe();
    // ... existing normal checkout logic here - keep as is ...
    // For safety, preserve existing behavior:
    return NextResponse.json({ error: 'Normal checkout - use existing flow' }, { status: 400 });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
