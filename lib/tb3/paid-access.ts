import storage from '@/config/tb3-paid-access.json';
import { tarrisPrices } from '@/src/clients/tarris/prices';
import { createHash, randomUUID } from 'node:crypto';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { airtableAtomicUpsert, airtableCreate, airtableConfigured, airtableQuery, airtableUpdate, escapeAirtableString, type AirtableRecord } from '@/lib/data/airtable-client';

export const TB3_ENTITLEMENTS_TABLE = storage.entitlementsTable;
export const TB3_ACCESS_EVENTS_TABLE = storage.activityTable;
export const TB3_OFFER = 'tb3_72h_access';
export const TB3_PRICE_CENTS = tarrisPrices.tb3;
export const TB3_ENTITLEMENT = 'tb3:72h:live';
export const TB3_ACCESS_COOKIE = 'tb3_paid_access';
export class PaidAccessError extends Error { constructor(public status: number, message: string) { super(message); } }
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
// Stripe's opaque live session ID is the high-entropy bearer source. Hashing it
// produces a stable token across webhook/return environments; only its hash is stored.
function accessToken(sessionId: string) { return createHash('sha256').update(`tb3:paid-access:v1:${sessionId}`).digest('base64url'); }
function verifiedAccessOrigin(value: string) {
  const url = new URL(value);
  const valid = ['tb3.online', 'www.tb3.online', 'ea-payments.vercel.app'].includes(url.hostname)
    || /^ea-payments-[a-z0-9-]+-the-architects-projects-cc813778\.vercel\.app$/.test(url.hostname);
  if (url.protocol !== 'https:' || !valid || url.origin !== value) throw new PaidAccessError(400, 'Invalid access destination.');
  return url.origin;
}
export function paidAccessReadiness() {
  return { stripeLive: Boolean(process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')), airtable: airtableConfigured(), email: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) };
}
export function paidAccessConfigured() { return Object.values(paidAccessReadiness()).every(Boolean); }
export function requirePaidSession(session: Stripe.Checkout.Session, expectedPrice = TB3_PRICE_CENTS) {
  const email = session.customer_details?.email || session.customer_email || '';
  if (!session.id.startsWith('cs_live_') || !session.livemode || session.payment_status !== 'paid' || session.mode !== 'payment'
    || session.metadata?.clientId !== 'tarris' || session.metadata?.commerceOfferId !== TB3_OFFER || session.metadata?.courseId !== 'tb3'
    || session.currency !== 'usd' || session.amount_total !== expectedPrice || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new PaidAccessError(403, 'A completed live TB3 payment is required.');
  }
  return email.toLowerCase();
}
async function rows(formula: string, maxRecords = 1) {
  if (!airtableConfigured()) throw new PaidAccessError(503, 'Airtable access tracking is not configured.');
  return airtableQuery(TB3_ENTITLEMENTS_TABLE, { filterByFormula: formula, maxRecords, strict: true });
}
export async function findPaidSession(sessionId: string) {
  return (await rows(`{Session ID}='${escapeAirtableString(sessionId)}'`))[0] || null;
}
export function entitlementActive(record: AirtableRecord, now = Date.now()) {
  const f = record.fields;
  return f.Status === 'active' && f.Course === 'tb3' && f.Entitlement === TB3_ENTITLEMENT
    && String(f['Session ID'] || '').startsWith('cs_live_') && Number.isFinite(Date.parse(String(f['Expires At'] || '')))
    && Date.parse(String(f['Expires At'])) > now;
}
export async function validateAccessToken(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const record = (await rows(`{Access Token Hash}='${hash(token)}'`))[0];
  return record && entitlementActive(record) ? record : null;
}
export async function recordAccess(record: AirtableRecord, activity: 'portal-opened' | 'learning-opened') {
  const now = new Date().toISOString();
  const event = await airtableCreate(TB3_ACCESS_EVENTS_TABLE, { 'Event ID': randomUUID(), 'Session ID': record.fields['Session ID'], Timestamp: now, Activity: activity });
  if (!event) throw new PaidAccessError(503, 'Access activity event could not be saved.');
  const previous = String(record.fields.Activity || '');
  const updated = await airtableUpdate(TB3_ENTITLEMENTS_TABLE, record.id, { 'Last Access': now, Activity: `${previous}\n${now} ${activity}`.slice(-20000) });
  if (!updated) throw new PaidAccessError(503, 'Access activity could not be saved.');
}
export async function ownerAccessRows(): Promise<AirtableRecord[]> {
  const [purchases, events] = await Promise.all([
    airtableQuery(TB3_ENTITLEMENTS_TABLE, { maxRecords: 100, sortField: 'Timestamp', sortDirection: 'desc', strict: true }),
    airtableQuery(TB3_ACCESS_EVENTS_TABLE, { maxRecords: 100, sortField: 'Timestamp', sortDirection: 'desc', strict: true }),
  ]);
  return purchases.map(record => {
    const activity = events.filter(event => event.fields['Session ID'] === record.fields['Session ID']);
    return { ...record, fields: { ...record.fields,
      'Last Access': activity[0]?.fields.Timestamp || record.fields['Last Access'],
      Activity: activity.length ? activity.map(event => `${event.fields.Timestamp} ${event.fields.Activity}`).join('\n') : record.fields.Activity,
    } };
  });
}
export async function createPaidCheckout(input: { email?: string; courseId: string; origin: string; priceCents: number }) {
  if (!paidAccessConfigured()) throw new PaidAccessError(503, 'Live payment and access delivery are not fully configured.');
  if (input.courseId !== 'tb3' || input.priceCents !== TB3_PRICE_CENTS || (input.email && !/^\S+@\S+\.\S+$/.test(input.email))) throw new PaidAccessError(400, 'A valid email and TB3 offer are required.');
  const session = await getStripe().checkout.sessions.create({ mode: 'payment', payment_method_types: ['card'],
    ...(input.email ? { customer_email: input.email.toLowerCase() } : {}), payment_intent_data: { metadata: { clientId: 'tarris', commerceOfferId: TB3_OFFER, courseId: 'tb3' } }, line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: input.priceCents, product_data: { name: 'TB3 72-hour access' } } }],
    metadata: { clientId: 'tarris', courseId: 'tb3', commerceOfferId: TB3_OFFER, accessOrigin: verifiedAccessOrigin(input.origin) },
    success_url: `${input.origin}/tarris/access/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${input.origin}/tarris?access=cancelled`,
  });
  if (!session.livemode || !session.id.startsWith('cs_live_') || !session.url) throw new PaidAccessError(503, 'Live checkout was not created.');
  return { sessionId: session.id, url: session.url, entitlement: 'pending-payment' };
}
export async function fulfillPaidAccess(sessionId: string, origin: string, provider?: Pick<Stripe, 'checkout'>) {
  if (!sessionId.startsWith('cs_live_')) throw new PaidAccessError(403, 'A live checkout session is required.');
  const session = await (provider || getStripe()).checkout.sessions.retrieve(sessionId, { expand: ['payment_intent.latest_charge'] });
  const email = requirePaidSession(session);
  const intent = typeof session.payment_intent === 'object' ? session.payment_intent : null;
  const charge = intent && typeof intent.latest_charge === 'object' ? intent.latest_charge : null;
  const receipt = charge?.receipt_url || '';
  if (charge?.refunded || (charge?.amount_refunded || 0) > 0) throw new PaidAccessError(403, 'Refunded payments cannot grant access.');
  if (!receipt) throw new PaidAccessError(503, 'The payment provider receipt is not available yet.');
  const token = accessToken(sessionId);
  const existing = await findPaidSession(sessionId);
  const paidAt = new Date(charge!.created * 1000).toISOString();
  // Stable expiry: return and webhook retries never restart the 72-hour period.
  const expiresAt = new Date(charge!.created * 1000 + 72 * 60 * 60 * 1000).toISOString();
  const record = await airtableAtomicUpsert(TB3_ENTITLEMENTS_TABLE, 'Session ID', existing ? {
    'Session ID': sessionId, 'Receipt URL': receipt,
  } : {
    'Session ID': sessionId, Email: email, Course: 'tb3', Entitlement: TB3_ENTITLEMENT,
    Timestamp: paidAt, 'Expires At': expiresAt, 'Access Token Hash': hash(token), Status: 'active',
    'Amount Paid': session.amount_total, Currency: session.currency, 'Payment Intent': intent?.id || '',
    'Receipt URL': receipt, Activity: `${new Date().toISOString()} payment-verified`,
  });
  if (!entitlementActive(record)) throw new PaidAccessError(403, 'This access has expired or been revoked.');
  const accessOrigin = verifiedAccessOrigin(session.metadata?.accessOrigin || origin);
  const accessLink = `${accessOrigin}/learn/tb3?entitlement=${token}`;
  let emailId = String(record.fields['Email ID'] || '');
  if (!emailId) {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) throw new PaidAccessError(503, 'Access saved, but email delivery is not configured.');
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `tb3-paid-access-${sessionId}` }, body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to: [email], subject: 'Your TB3 access is ready', text: `Your payment is confirmed. Open your 72-hour access: ${accessLink}\nAccess expires: ${expiresAt}\nPayment receipt: ${receipt}` }) });
    const result = await response.json() as { id?: string };
    if (!response.ok || !result.id) throw new PaidAccessError(503, 'Access saved, but the confirmation email could not be sent.');
    emailId = result.id;
    if (!(await airtableUpdate(TB3_ENTITLEMENTS_TABLE, record.id, { 'Email ID': emailId }))) throw new PaidAccessError(503, 'Email sent, but delivery tracking could not be saved.');
  }
  return { successPage: `${accessOrigin}/tarris/access/success?session_id=${sessionId}`, accessLink, receiptPdf: receipt, nextSteps: 'Open your access link. Your access expires 72 hours after payment.', emailId };
}

export async function revokeRefundedAccess(charge: Stripe.Charge) {
  const paymentIntent = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!charge.livemode || charge.metadata?.clientId !== 'tarris' || charge.metadata?.commerceOfferId !== TB3_OFFER || !paymentIntent) return;
  const records = await rows(`{Payment Intent}='${escapeAirtableString(paymentIntent)}'`, 100);
  for (const record of records) {
    if (!(await airtableUpdate(TB3_ENTITLEMENTS_TABLE, record.id, { Status: 'revoked', Activity: `${String(record.fields.Activity || '')}\n${new Date().toISOString()} payment-refunded` }))) throw new PaidAccessError(503, 'Refund revocation could not be saved.');
  }
}
