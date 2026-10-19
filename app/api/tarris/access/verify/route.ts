import { NextRequest, NextResponse } from 'next/server';
import { createWelcomeAdapter } from '@/src/chassis/adapters/welcome.adapter';
import { tarrisConfig } from '@/src/clients/tarris/chassis.config';
import { PaidAccessError, fulfillPaidAccess } from '@/lib/tb3/paid-access';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const body = await req.json().catch(() => null);
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
  if (!/^cs_live_[A-Za-z0-9]+$/.test(sessionId)) return NextResponse.json({ error: 'A live payment session is required.' }, { status: 400 });
  try {
    const origin = process.env.VERCEL_ENV === 'preview' ? `https://${process.env.VERCEL_URL}` : (process.env.TB3_PUBLIC_ORIGIN || 'https://tb3.online');
    const config = { ...tarrisConfig, commerce: { ...tarrisConfig.commerce!, welcome: ({ sessionId }: { sessionId: string }) => fulfillPaidAccess(sessionId, origin) } };
    const delivery = await createWelcomeAdapter(config).welcome({ sessionId });
    return NextResponse.json(delivery, { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
  } catch (error) { return NextResponse.json({ error: error instanceof PaidAccessError ? error.message : 'Payment verification or access delivery could not be completed.' }, { status: error instanceof PaidAccessError ? error.status : 503 }); }
}
