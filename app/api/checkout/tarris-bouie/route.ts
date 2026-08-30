import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  return NextResponse.json({
    ok: stripeConfigured,
    stripeConfigured,
    paymentVerification: 'stripe-server-api',
    contractArchive: 'efficiency-architects-service',
  }, { status: stripeConfigured ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || 'tarrisb73@yahoo.com').trim().toLowerCase();
    const allowedEmail = 'tarrisb73@yahoo.com';
    if (email !== allowedEmail) return NextResponse.json({ error: 'This payment page is assigned to the Tarris Bouie agreement.' }, { status: 400 });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ea-payments.vercel.app';
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'us_bank_account'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: 50000,
          product_data: {
            name: 'Tarris Bouie Project Deposit',
            description: 'Initial $500 deposit under the Efficiency Architects Client Services Agreement.',
          },
        },
        quantity: 1,
      }],
      customer_email: allowedEmail,
      metadata: {
        commerceOfferId: 'tarris_bouie_deposit',
        packageId: 'tarris_bouie_deposit',
        packageName: 'Implementation Package',
        packageDisplayName: 'Tarris Bouie Project Deposit',
        clientName: 'Tarris Bouie',
        organization: 'Tarris Bouie',
        contractRecordId: 'recd9zuiS7lDhBLAm',
        paymentStage: 'deposit',
        fulfillmentType: 'implementation',
        fulfillmentLabel: 'Record the project deposit and begin the contracted Tarris Bouie implementation.',
        reviewRequired: 'true',
      },
      success_url: `${baseUrl}/pay/tarris-bouie/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pay/tarris-bouie?payment=cancelled`,
    });

    if (!session.url) return NextResponse.json({ error: 'Stripe did not return a checkout URL.' }, { status: 500 });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[tarris-payment] checkout failed', error);
    return NextResponse.json({ error: 'Unable to open secure payment.' }, { status: 500 });
  }
}
