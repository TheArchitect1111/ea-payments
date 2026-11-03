import { NextRequest, NextResponse } from 'next/server';
import { isAllowedAmandaOrigin } from '@/lib/amanda-catherine/request-origin';
import { registerAmandaCheckout } from '@/lib/amanda-catherine/payments';
import { saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';

export const dynamic = 'force-dynamic';
const API = 'https://connect.squareupsandbox.com';
export async function POST(req: NextRequest) {
  if (!isAllowedAmandaOrigin(req)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  const body = (await req.json().catch(() => null)) || {};
  const email = String(body.email || '').trim().toLowerCase().slice(0, 254);
  const name = String(body.name || '').trim().slice(0, 120);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || name.length < 2)
    return NextResponse.json({ error: 'Enter your name and email.' }, { status: 400 });
  // Dedicated sandbox credentials only. No production-token fallback.
  const token = process.env.SQUARE_SANDBOX_ACCESS_TOKEN?.trim();
  const location = process.env.SQUARE_SANDBOX_LOCATION_ID?.trim();
  if (!token || !location) return NextResponse.json({ error: 'Square sandbox checkout is not configured.' }, { status: 503 });
  const registrationId = crypto.randomUUID();
  try {
    const response = await fetch(API + '/v2/online-checkout/payment-links', {
      method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Square-Version': '2026-09-16', 'Content-Type': 'application/json' },
      body: JSON.stringify({ idempotency_key: registrationId,
        quick_pay: { name: 'Wood Therapy — $1 WORKFLOW TEST', price_money: { amount: 100, currency: 'CAD' }, location_id: location },
        payment_note: 'EA-AMANDA-TEST:' + registrationId, pre_populated_data: { buyer_email: email } }),
      signal: AbortSignal.timeout(15000), cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || !data.payment_link?.order_id || !data.payment_link?.url) throw new Error('Sandbox checkout failed');
    const url = new URL(data.payment_link.url);
    if (url.protocol !== 'https:' || !(url.hostname === 'sandbox.square.link' || url.hostname === 'connect.squareupsandbox.com'))
      throw new Error('Sandbox checkout returned an unexpected host');
    await registerAmandaCheckout({ registrationId, brickId: 'wood-therapy-certification', name, email,
      source: '/amanda-catherine/square-test', isTest: true });
    const orderId = String(data.payment_link.order_id);
    const saved = await saveStudioRecord({ recordType: 'experience', id: 'amanda-square-test-order-' + orderId,
      organizationId: syntheticOrgId('amanda-catherine'), title: '[TEST] Wood Therapy Square pending order',
      payload: { email, name, class_name: 'Wood Therapy', class_id: 'wood-therapy', course_id: 'wood-therapy-certification',
        registration_id: registrationId, order_id: orderId, expected_amount: 100, currency: 'CAD',
        payment_status: 'unpaid', is_test: true, provider_environment: 'sandbox', created_at: new Date().toISOString() } });
    if (!saved.ok || !saved.persistedToAirtable) throw new Error('Test order could not be saved');
    return NextResponse.json({ url: url.toString(), registrationId });
  } catch {
    return NextResponse.json({ error: 'Square test checkout could not be opened. Please try again.' }, { status: 503 });
  }
}
