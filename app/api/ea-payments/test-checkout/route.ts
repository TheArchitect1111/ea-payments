import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  const url = req.nextUrl;
  const courseId = url.searchParams.get('product') || 'wood-therapy-training';
  const email = url.searchParams.get('email') || 'brickmail1@gmail.com';
  const origin = url.origin;
  const amount = 100;
  const successUrl = `${origin}/amanda-catherine/enroll/${courseId}?test=1&success=true&paid=1&email=${encodeURIComponent(email)}&amount=100&workflow=premium`;
  const token = process.env.SQUARE_ACCESS_TOKEN || '';
  const loc = process.env.SQUARE_LOCATION_ID || '';
  if (!token || !loc) return NextResponse.redirect(successUrl, 303);
  const base = process.env.SQUARE_ENV === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';
  try {
    const res = await fetch(`${base}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Square-Version': '2024-12-18' },
      body: JSON.stringify({
        idempotency_key: `${courseId}-test-${Date.now()}`,
        quick_pay: { name: `[TEST $1] ${courseId}`, price_money: { amount, currency: 'CAD' }, location_id: loc },
        checkout_options: { redirect_url: successUrl, ask_for_shipping_address: false },
        pre_populated_data: { buyer_email: email }
      })
    });
    const data = await res.json();
    const checkoutUrl = data.payment_link?.url || successUrl;
    return NextResponse.redirect(checkoutUrl, 303);
  } catch {
    return NextResponse.redirect(successUrl, 303);
  }
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
