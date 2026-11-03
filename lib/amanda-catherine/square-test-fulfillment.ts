import { loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';
import { registerAmandaPaid } from './brick-events';
import { provisionAmandaClientAccess } from './client-access';
import { getClientByEmail } from '@/lib/airtable';
import { requestPortalPasswordReset } from '@/lib/ea-portal-password-reset';
import { sendAuthEmail } from '@/lib/ea-auth-email';
import { sendAmandaPremiumReceiptEmail } from './premium-receipt-email';
import { getAmandaConfirmationLetter } from './confirmation-letters';

const API = 'https://connect.squareupsandbox.com';
export type SquareTestOrder = { email: string; name: string; class_id: string; course_id: string;
  registration_id: string; order_id: string; expected_amount: number; currency: string;
  is_test: boolean; provider_environment: string; payment_status: string; payment_reference?: string;
  paid_at?: string; expires_at?: string; access_ready?: boolean; setup_sent?: boolean; confirmation_sent?: boolean };
export async function squareSandboxGet(path: string) {
  const token = process.env.SQUARE_SANDBOX_ACCESS_TOKEN?.trim();
  if (!token) throw new Error('Square sandbox is not configured.');
  const response = await fetch(API + path, { headers: { Authorization: 'Bearer ' + token, 'Square-Version': '2026-09-16' },
    cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Square sandbox verification is unavailable.');
  return response.json();
}
const safe = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
async function persist(order: SquareTestOrder) {
  const saved = await saveStudioRecord({ recordType: 'experience', id: 'amanda-square-test-order-' + order.order_id,
    organizationId: syntheticOrgId('amanda-catherine'), title: '[TEST] Wood Therapy Square enrollment', payload: order });
  if (!saved.ok || !saved.persistedToAirtable) throw new Error('Test enrollment could not be saved.');
}
/** Payment IDs come from a signed sandbox webhook or a sandbox order fetched on the server. */
export async function fulfillSquareTestPayment(paymentId: string, expectedOrderId?: string) {
  if (!/^[a-zA-Z0-9_-]{8,120}$/.test(paymentId)) throw new Error('Invalid sandbox payment reference.');
  const { payment } = await squareSandboxGet('/v2/payments/' + encodeURIComponent(paymentId));
  if (payment?.status !== 'COMPLETED') return { pending: true as const };
  if (payment.id !== paymentId || payment.amount_money?.currency !== 'CAD' || Number(payment.amount_money?.amount) !== 100 ||
      !process.env.SQUARE_SANDBOX_LOCATION_ID || payment.location_id !== process.env.SQUARE_SANDBOX_LOCATION_ID ||
      !payment.order_id || (expectedOrderId && payment.order_id !== expectedOrderId)) throw new Error('Square test payment does not match this checkout.');
  let order = await loadStudioRecord<SquareTestOrder>('experience', 'amanda-square-test-order-' + payment.order_id);
  if (!order || order.order_id !== payment.order_id || order.is_test !== true || order.provider_environment !== 'sandbox' ||
      order.expected_amount !== 100 || order.currency !== 'CAD' || order.class_id !== 'wood-therapy' ||
      order.course_id !== 'wood-therapy-certification' || !/^\S+@\S+\.\S+$/.test(order.email) ||
      (order.payment_reference && order.payment_reference !== paymentId)) throw new Error('Unknown Square test registration.');
  const paidAt = String(payment.created_at || '');
  if (!Number.isFinite(Date.parse(paidAt))) throw new Error('Square test payment date is invalid.');
  const expiresAt = new Date(Date.parse(paidAt) + 72 * 3600000).toISOString();
  const tracking = await registerAmandaPaid({ registrationId: order.registration_id, brickId: order.course_id,
    name: order.name, email: order.email, phone: '', reference: paymentId, timestamp: paidAt, isTest: true });
  if (!tracking.ok) throw new Error('Test payment tracking needs a retry.');
  order = { ...order, payment_status: 'paid', payment_reference: paymentId, paid_at: paidAt, expires_at: expiresAt };
  await persist(order);
  const access = await provisionAmandaClientAccess({ email: order.email, name: order.name, audience: 'student-trainee',
    amountPaidCad: 1, transactionId: paymentId, courseIds: [order.course_id], isTestAccess: true,
    testPaidAt: paidAt, expiresAt, squareTest: { paymentId } });
  if (!access.ok) throw new Error(access.error || 'Test course access needs a retry.');
  order = { ...order, access_ready: true }; await persist(order);
  const learningUrl = 'https://amandacatherine.ca/portal/login?next=%2Fportal%2Famanda-catherine%2Flearning';
  if (!order.setup_sent) {
    const client = await getClientByEmail(order.email);
    const needsSetup = !client?.passwordChanged || !client?.passwordHash;
    const reset = needsSetup ? await requestPortalPasswordReset(order.email, 'https://amandacatherine.ca') : null;
    if (needsSetup && !reset) throw new Error('Secure student password setup needs a retry.');
    const sent = await sendAuthEmail({ to: order.email, subject: '[TEST] Your Wood Therapy student portal', title: 'Your test course access is ready',
      brandLabel: 'Amanda Catherine · AesthetiKine',
      bodyHtml: '<p>Your CAD $1 Square test enrollment is confirmed.</p>' +
        (reset ? '<p><a href="' + safe(reset.resetUrl) + '">Set your portal password</a>. This link expires in 30 minutes.</p>' : '<p>Use your existing portal password.</p>') +
        '<p><a href="' + learningUrl + '">Open Wood Therapy in your student portal</a></p>',
      text: 'Wood Therapy test access: ' + learningUrl + (reset ? '. Set your password: ' + reset.resetUrl : '. Use your existing password.') });
    if (!sent.ok) throw new Error('Student welcome delivery needs a retry.');
    order = { ...order, setup_sent: true }; await persist(order);
  }
  if (!order.confirmation_sent) {
    const letter = await getAmandaConfirmationLetter('live');
    const html = letter.body_html.replace(/{{first_name}}/g, safe(order.name.split(/\s+/)[0])).replace(/{{class_name}}/g, 'Wood Therapy');
    const sent = await sendAmandaPremiumReceiptEmail({ to: order.email, subject: '[TEST] Wood Therapy — receipt and welcome',
      html: html + '<p>Square Sandbox payment: CAD $1.00. Reference: ' + safe(paymentId) + '.</p><p><a href="' + learningUrl + '">Open your student portal</a></p><p>Test preview: 72 hours. No physical kit or automatic renewal.</p>',
      text: 'Square Sandbox CAD $1 test confirmed. Wood Therapy: ' + learningUrl,
      idempotencyKey: 'amanda-square-test-receipt-' + paymentId,
      receipt: { customer: order.name, program: 'Wood Therapy [TEST]', amountCad: 1, provider: 'Square', reference: paymentId,
        paidAt, isTest: true, expiresAt } });
    if (!sent.ok) throw new Error('Test receipt delivery needs a retry.');
    order = { ...order, confirmation_sent: true }; await persist(order);
  }
  return { pending: false as const, ok: true, email: order.email, loginUrl: learningUrl };
}
