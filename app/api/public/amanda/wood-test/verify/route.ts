import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireTestKey, isVerifiedWoodTest } from '@/lib/amanda-catherine/reusable-test';
import { fulfillAmandaCheckout } from '@/lib/amanda-catherine/payment-fulfillment';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!/^cs_test_[a-zA-Z0-9]+$/.test(String(body.sessionId || ''))) return NextResponse.json({ error: 'A Stripe TEST session is required.' }, { status: 400 });
  try {
    const session = await new Stripe(requireTestKey()).checkout.sessions.retrieve(body.sessionId);
    if (!isVerifiedWoodTest(session)) return NextResponse.json({ error: 'This is not a Wood Therapy test.' }, { status: 403 });
    const result = await fulfillAmandaCheckout(session, 'return-verification');
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json({ ok: true, email: result.record.email, loginUrl: result.access.loginUrl, welcomeSent: result.access.welcomeSent });
  } catch {
    return NextResponse.json({ error: 'Your test payment could not be verified. If you paid, do not pay again.' }, { status: 409 });
  }
}
