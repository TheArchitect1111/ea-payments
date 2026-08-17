import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { fulfillAmandaCheckout } from '@/lib/amanda-catherine/payment-fulfillment';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Enrollment verification is temporarily unavailable.' }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as { sessionId?: string };
  const sessionId = String(body.sessionId || '').trim();
  if (!sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'A valid enrollment session is required.' }, { status: 400 });
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });
    const metadata = session.metadata || {};
    if (metadata.portalSlug !== 'amanda-catherine' || metadata.enrollmentFlow !== 'public-course-v1') {
      return NextResponse.json({ error: 'This is not an Amanda course enrollment.' }, { status: 403 });
    }
    const result = await fulfillAmandaCheckout(session, 'return-verification');
    if (!result.ok) {
      return NextResponse.json({ error: result.error, paymentRecorded: result.paymentRecorded || false }, { status: 409 });
    }
    return NextResponse.json({
      ok: true,
      email: result.record.email,
      courseId: result.record.courseId,
      loginUrl: result.access.loginUrl,
      welcomeSent: result.access.welcomeSent,
    });
  } catch (error) {
    console.error('[amanda-enrollment] verification failed', error);
    return NextResponse.json({ error: 'Enrollment payment could not be verified.' }, { status: 502 });
  }
}
