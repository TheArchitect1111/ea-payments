import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { fulfillSquareTestPayment } from '@/lib/amanda-catherine/square-test-fulfillment';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const key = process.env.SQUARE_SANDBOX_WEBHOOK_SIGNATURE_KEY;
  const url = process.env.SQUARE_SANDBOX_WEBHOOK_NOTIFICATION_URL;
  if (!key || !url) return NextResponse.json({ error: 'Square sandbox webhook is not configured.' }, { status: 503 });
  const raw = await req.text();
  const actual = Buffer.from(req.headers.get('x-square-hmacsha256-signature') || '');
  const expected = Buffer.from(createHmac('sha256', key).update(url + raw).digest('base64'));
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return NextResponse.json({ error: 'Invalid sandbox signature.' }, { status: 403 });
  try {
    const event = JSON.parse(raw);
    if (!['payment.created', 'payment.updated'].includes(event.type)) return NextResponse.json({ received: true });
    await fulfillSquareTestPayment(String(event.data?.object?.payment?.id || ''));
    return NextResponse.json({ received: true });
  } catch { return NextResponse.json({ error: 'Sandbox fulfillment needs a retry.' }, { status: 503 }); }
}
