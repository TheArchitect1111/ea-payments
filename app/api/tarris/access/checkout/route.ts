import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutAdapter } from '@/src/chassis/adapters/checkout.adapter';
import { tarrisConfig } from '@/src/clients/tarris/chassis.config';
import { PaidAccessError, paidAccessConfigured, paidAccessReadiness } from '@/lib/tb3/paid-access';
export const dynamic = 'force-dynamic';
export async function GET() {
  const catalog = await tarrisConfig.catalogSource();
  return NextResponse.json({ configured: paidAccessConfigured() && catalog.status === 200, checks: { ...paidAccessReadiness(), airtableReadable: catalog.status === 200 }, currency: 'usd', priceCents: tarrisConfig.prices.tb3, durationHours: 72 }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const input = await req.json().catch(() => null);
  if (!input || (input.email !== undefined && (typeof input.email !== 'string' || input.email.length > 254 || !/^\S+@\S+\.\S+$/.test(input.email.trim())))) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 });
  try {
    const origin = process.env.VERCEL_ENV === 'preview' ? `https://${process.env.VERCEL_URL}` : (process.env.TB3_PUBLIC_ORIGIN || 'https://tb3.online');
    const checkout = await createCheckoutAdapter(tarrisConfig).checkout({ type: 'stripe-live', courseId: 'tb3', email: input.email?.trim(), returnOrigin: origin });
    return NextResponse.json({ url: checkout.url }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return NextResponse.json({ error: error instanceof PaidAccessError ? error.message : 'Secure checkout is unavailable.' }, { status: error instanceof PaidAccessError ? error.status : 503 }); }
}
