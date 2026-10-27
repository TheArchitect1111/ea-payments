import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}));
    const cart = body.cart || [{ id: 'tb3-tee-black-m', quantity: 1 }];
    const email = body.email || 'test@tb3.online';
    
    // Direct family-owned - use TB3_STRIPE_SECRET_KEY directly
    const Stripe = (await import('stripe')).default;
    if (!process.env.TB3_STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'TB3 Stripe key not configured' }, { status: 503 });
    }
    const stripe = new Stripe(process.env.TB3_STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as any });
    
    // Create checkout session directly on family account - revenue goes to Bouie family
    const session = await stripe.checkout.sessions.create({
      line_items: (Array.isArray(cart) ? cart : [cart]).map((it:any)=>({
        price_data: {
          currency: 'usd',
          product_data: { name: it.name || it.id || 'TB3 Merch' },
          unit_amount: Math.round((it.price || 29.99) * 100)
        },
        quantity: it.quantity || 1
      })),
      mode: 'payment',
      customer_email: email,
      success_url: 'https://tb3.online/tarris/merch/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://tb3.online/tarris/merch',
      metadata: { tenant: 'tarris', printful_store_id: '18945233', origin: 'direct-family' }
    });
    
    return NextResponse.json({ url: session.url, id: session.id, mode: 'direct-family' });
  } catch (e:any) {
    console.error('checkout error', e);
    return NextResponse.json({ error: e.message || 'Checkout failed' }, { status: 500 });
  }
}
export async function GET() {
  return NextResponse.json({ available: true, mode: 'direct', message: 'TB3 merch checkout - direct family-owned' });
}
