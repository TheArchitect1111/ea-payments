import { createHash, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { loadStudioRecord } from '@/lib/creative-studio/persistence';
import { squareSandboxGet, fulfillSquareTestPayment } from '@/lib/amanda-catherine/square-test-fulfillment';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) || {};
  if (!/^[0-9a-f-]{36}$/.test(String(body.registrationId || '')) || !/^[A-Za-z0-9_-]{43}$/.test(String(body.token || '')))
    return NextResponse.json({ error: 'Invalid test confirmation link.' }, { status: 400 });
  const status = await loadStudioRecord<{ orderId: string; tokenHash: string }>('experience', 'amanda-square-test-status-' + body.registrationId);
  const expected = Buffer.from(status?.tokenHash || '');
  const received = Buffer.from(createHash('sha256').update(body.token).digest('hex'));
  if (!status || expected.length !== received.length || !timingSafeEqual(expected, received))
    return NextResponse.json({ error: 'Invalid test confirmation link.' }, { status: 403 });
  try {
    const data = await squareSandboxGet('/v2/orders/' + encodeURIComponent(status.orderId));
    if (data.order?.id !== status.orderId) throw new Error('Order mismatch');
    const paymentId = data.order?.tenders?.[0]?.payment_id || data.order?.tenders?.[0]?.id;
    if (!paymentId) return NextResponse.json({ pending: true });
    return NextResponse.json(await fulfillSquareTestPayment(String(paymentId), status.orderId));
  } catch { return NextResponse.json({ error: 'Your test enrollment needs a retry. If you completed payment, do not pay again.' }, { status: 503 }); }
}
