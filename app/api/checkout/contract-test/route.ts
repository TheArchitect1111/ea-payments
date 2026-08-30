import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';
const allowedEmail = 'brickmail1@gmail.com';
const contractRecordId = 'recqfvWR5lWNsU6K8';

export async function GET() {
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  return NextResponse.json({ ok: stripeConfigured, stripeConfigured, amount: 1, currency: 'USD' }, { status: stripeConfigured ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || allowedEmail).trim().toLowerCase();
    if (email !== allowedEmail) return NextResponse.json({ error: 'This test payment is assigned to the contract test.' }, { status: 400 });
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ea-payments.vercel.app';
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'usd', unit_amount: 100, product_data: { name: 'Efficiency Architects Contract System Test', description: '$1 end-to-end signature and payment workflow test.' } }, quantity: 1 }],
      customer_email: allowedEmail,
      metadata: { commerceOfferId: 'ea_contract_test_1', packageId: 'ea_contract_test_1', contractRecordId, paymentStage: 'test', clientName: 'Robert Brickey' },
      success_url: `${baseUrl}/pay/contract-test/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pay/contract-test?payment=cancelled`,
    });
    if (!session.url) return NextResponse.json({ error: 'Stripe did not return a checkout URL.' }, { status: 500 });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[contract-test] checkout failed', error);
    return NextResponse.json({ error: 'Unable to open secure test payment.' }, { status: 500 });
  }
}
