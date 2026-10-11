import { recordAmandaKitOrder } from './practitioner-kit-orders';
import { handleAmandaSubmit } from '@/lib/amanda-catherine/storage';
import { getAmandaConfirmationLetter } from '@/lib/amanda-catherine/confirmation-letters';
import { sendAuthEmail } from '@/lib/ea-auth-email';
import { amandaTrialFromStripeSession } from './test-access-rules';
import { amandaCourseReady } from './lms-policy';
import { createHash } from 'node:crypto';
import type Stripe from 'stripe';
import { AMANDA_MEMBERSHIPS, AMANDA_OFFERS } from '@/lib/amanda-catherine/config';
import { listStudioRecords, loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';
import { canonicalPlatformOrigin } from '@/lib/platform-urls';
import { emitPulseEvent } from '@/lib/pulse-bus';
import { sendAdminNotification, sendPaymentConfirmationEmail } from '@/lib/email';
import { provisionAmandaClientAccess } from '@/lib/amanda-catherine/client-access';
import type { AmandaPortalAudience } from '@/lib/amanda-catherine/config';
import { publishPlatformActivityEvent } from '@/lib/activity-events-store';

export type AmandaPaymentRecord = {
  id: string; portalSlug: string; email: string; stripeSessionId: string;
  kind: 'offer' | 'membership'; offerId?: string; courseId?: string; membershipId?: string;
  paymentOption?: 'full' | 'deposit' | 'test'; amountPaidCad: number; currency: string;
  paymentStatus: string; stripeCustomerId?: string; stripeSubscriptionId?: string;
  subscriptionStatus?: string; customerConfirmationSentAt?: string; adminNotificationSentAt?: string;
  isTestAccess?: boolean; testPaidAt?: string | null; expiresAt?: string | null; trackingLetterSentAt?: string;
  trackingRegistrationId?: string;
  recordedAt: string; updatedAt: string;
};

function recordId(stripeSessionId: string) { return `amanda-payment-${createHash('sha256').update(stripeSessionId).digest('hex').slice(0, 24)}`; }
function paymentEmail(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  return (meta.clientEmail || session.customer_details?.email || session.customer_email || '').trim().toLowerCase();
}
function stringId(value: string | { id?: string } | null | undefined) { return typeof value === 'string' ? value : value?.id || undefined; }
export function isAmandaCheckoutSession(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  return Boolean(meta.portalSlug?.toLowerCase().startsWith('amanda-catherine') && (meta.amandaOfferId || meta.amandaMembershipId));
}
async function persistPaymentRecord(record: AmandaPaymentRecord, title: string) {
  return saveStudioRecord({ recordType: 'experience', id: record.id, organizationId: syntheticOrgId(record.portalSlug), title, payload: record });
}

export async function fulfillAmandaCheckout(session: Stripe.Checkout.Session, source: 'webhook' | 'return-verification') {
  const meta = session.metadata ?? {};
  const portalSlug = String(meta.portalSlug || '').trim().toLowerCase();
  const email = paymentEmail(session);
  if (!portalSlug.startsWith('amanda-catherine') || !email) return { ok: false as const, error: 'Amanda payment identity is incomplete.' };
  const offer = AMANDA_OFFERS.find((item) => item.id === meta.amandaOfferId);
  const membership = AMANDA_MEMBERSHIPS.find((item) => item.id === meta.amandaMembershipId);
  if (!offer && !membership) return { ok: false as const, error: 'Amanda offer or membership was not recognized.' };
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') return { ok: false as const, error: 'Stripe has not confirmed this payment.' };

  const courseId = offer && 'courseId' in offer ? offer.courseId : undefined;
  if (meta.amandaCourseId && meta.amandaCourseId !== courseId) return { ok: false as const, error: 'Course does not match the purchased offer.' };
  if (courseId && !amandaCourseReady(courseId)) return { ok: false as const, error: 'This course is waitlist only; access cannot be granted.' };

  if (courseId) {
    const kit = await recordAmandaKitOrder(session, courseId);
    if (!kit.ok) return { ok: false as const, error: kit.error || 'Kit fulfillment could not be recorded.' };
  }
  const id = recordId(session.id); const existing = await loadStudioRecord<AmandaPaymentRecord>('experience', id); const now = new Date().toISOString();
  const trial = amandaTrialFromStripeSession(session, courseId);
  const isTestAccess = Boolean(trial);
  const testPaidAt = trial?.testPaidAt ?? null;
  const expiresAt = trial?.expiresAt ?? null;
  let record: AmandaPaymentRecord = {
    id, portalSlug, email, stripeSessionId: session.id, kind: membership ? 'membership' : 'offer', offerId: offer?.id,
    courseId,
    membershipId: membership?.id,
    paymentOption: meta.paymentOption === 'deposit' || meta.paymentOption === 'full' || meta.paymentOption === 'test' ? meta.paymentOption : undefined,
    amountPaidCad: (session.amount_total ?? 0) / 100, currency: String(session.currency || 'cad').toUpperCase(), paymentStatus: session.payment_status,
    stripeCustomerId: stringId(session.customer), stripeSubscriptionId: stringId(session.subscription), subscriptionStatus: membership ? 'active' : undefined,
    customerConfirmationSentAt: existing?.customerConfirmationSentAt, adminNotificationSentAt: existing?.adminNotificationSentAt,
    isTestAccess, trackingRegistrationId:meta.registrationId || existing?.trackingRegistrationId,
    testPaidAt: existing?.testPaidAt ?? testPaidAt, expiresAt: existing?.expiresAt ?? expiresAt,
    trackingLetterSentAt: existing?.trackingLetterSentAt,
    recordedAt: existing?.recordedAt ?? now, updatedAt: now,
  };
  const label = membership?.name ?? offer!.name;
  const title = membership ? `Amanda membership payment: ${membership.name}` : `Amanda offer payment: ${offer!.name}${record.paymentOption === 'test' ? ' [PRIVATE TEST]' : ''}`;
  const saved = await persistPaymentRecord(record, title); if (!saved.ok) return { ok: false as const, error: saved.error || 'Payment record could not be saved.' };
  let notificationStateChanged = false; const transactionId = stringId(session.payment_intent) || session.id;

  if (!record.customerConfirmationSentAt) {
    try {
      const confirmation = await sendPaymentConfirmationEmail({
        email, clientName: session.customer_details?.name || String(meta.clientName || '') || email,
        packageName: record.paymentOption === 'test' ? `${label} — Private Test` : label, amountPaid: record.amountPaidCad,
        paymentDate: now.slice(0, 10), portalUrl: `${canonicalPlatformOrigin()}/portal/${portalSlug}/learning`, stripeTransactionId: transactionId,
      });
      if (confirmation.ok) { record = { ...record, customerConfirmationSentAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; notificationStateChanged = true; }
      else console.error('[amanda-payment] confirmation email failed', confirmation.error);
    } catch (error) { console.error('[amanda-payment] confirmation email failed', error); }
  }
  if (!record.adminNotificationSentAt) {
    try {
      const adminNotice = await sendAdminNotification({ clientName: session.customer_details?.name || String(meta.clientName || '') || email, organization: 'Amanda Catherine · AesthetiKine', email, packageName: record.paymentOption === 'test' ? `${label} — Private Test` : label, amountPaid: record.amountPaidCad, paymentDate: now.slice(0, 10), paymentMethodTypes: Array.isArray(session.payment_method_types) ? session.payment_method_types : [], stripeTransactionId: transactionId });
      if (adminNotice.ok) { record = { ...record, adminNotificationSentAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; notificationStateChanged = true; }
      else console.error('[amanda-payment] admin notification failed', adminNotice.error);
    } catch (error) { console.error('[amanda-payment] admin notification failed', error); }
  }
  if (notificationStateChanged) { const notificationSave = await persistPaymentRecord(record, title); if (!notificationSave.ok) console.error('[amanda-payment] notification status persistence failed', notificationSave.error); }

  const audience: AmandaPortalAudience = membership ? 'member-community-participant' : offer?.id === 'lifeline-artist-business-launch' ? 'media-guest' : offer?.id.includes('training') || offer?.id.includes('certification') ? 'student-trainee' : 'client';
  const access = await provisionAmandaClientAccess({ email, name: session.customer_details?.name || String(meta.clientName || ''), audience, amountPaidCad: record.amountPaidCad, transactionId, courseIds: record.courseId ? [record.courseId] : [], isTestAccess, testPaidAt: record.testPaidAt, expiresAt: record.expiresAt, stripeSessionId: session.id });
  if (!access.ok) {
    console.error('[amanda-payment] client portal access provisioning failed', access.error);
    await emitPulseEvent({ product: 'ea-platform', type: 'fulfillment.review_required', title: 'Amanda client access needs attention', detail: `${email} · ${access.error}`, priority: 'high', href: `/portal/${portalSlug}/deliveries`, tenantId: portalSlug, objectId: id });
    return { ok: false as const, error: access.error || 'Student access could not be provisioned.', paymentRecorded: true as const };
  }
  // Only Square's signed callback or Stripe's verified checkout can mark tracking paid.
  // Never create a second registration from payment fulfillment.
  if (courseId && meta.registrationId && session.payment_status === 'paid') {
    try {
      await handleAmandaSubmit({}, undefined, {
        event_type:'payment_confirmed', registration_id:meta.registrationId, email, class_id:courseId,
        payment_status:'paid', payment_reference:transactionId, payment_provider:'stripe',
        timestamp:now, is_test:isTestAccess,
      });
    } catch(error) {
      console.error('[amanda-payment] verified payment tracking sync failed',error);
      return {ok:false as const,error:'Verified payment could not be linked to its signup.',paymentRecorded:true as const};
    }
  }
  // Amanda's approved confirmation letter is separate from Stripe's receipt.
  if (isTestAccess && courseId && !record.trackingLetterSentAt) {
    try {
      const letter=await getAmandaConfirmationLetter('live');
      const firstName=String(meta.clientName || session.customer_details?.name || email).split(/\s+/)[0];
      const safe=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const html=letter.body_html.replace(/{{first_name}}/g,safe(firstName))
        .replace(/{{class_name}}/g,safe(label));
      const sent=await sendAuthEmail({to:email,subject:'[PRIVATE TEST] '+letter.subject.replace(/{{class_name}}/g,label),
        title:'Amanda Catherine registration confirmation [TEST]',bodyHtml:html,
        text:'[PRIVATE TEST] '+firstName+', your test registration for '+label+' is confirmed. Payment: CAD $1.'});
      if (!sent.ok) throw new Error(sent.error || 'Test confirmation delivery failed');
      record={...record,trackingLetterSentAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
      const persisted=await persistPaymentRecord(record,title);
      if(!persisted.ok)throw new Error(persisted.error || 'Letter delivery state could not be saved');
    }catch(error){console.error('[amanda-payment] test confirmation letter failed',error);
      return {ok:false as const,error:'Confirmation letter was not delivered.',paymentRecorded:true as const};}
  }
  if (!existing) {
    await publishPlatformActivityEvent({ organizationId: 'amanda-catherine', module: 'payments', eventType: 'payment_fulfilled', title: membership ? `Amanda membership activated · ${label}` : `Amanda payment fulfilled · ${label}`, summary: `CAD ${record.amountPaidCad.toFixed(2)} payment fulfilled`, priority: 90, actionLabel: 'Open Amanda billing', actionUrl: `/portal/${portalSlug}/billing`, metadata: { stripeSessionId: session.id, transactionId, offerId: offer?.id || '', membershipId: membership?.id || '', courseId: record.courseId || '', source, accessProvisioned: 'true' } });
    await emitPulseEvent({ product: 'ea-platform', type: membership ? 'subscription.started' : 'payment.received', title: membership ? `Amanda membership active — ${label}` : record.paymentOption === 'test' ? `Amanda private test payment — ${label}` : `Amanda payment received — ${label}`, detail: `CAD $${record.amountPaidCad.toFixed(2)} · ${email}`, priority: record.paymentOption === 'test' ? 'medium' : 'high', href: `/portal/${portalSlug}/billing`, tenantId: portalSlug, objectId: id, metadata: { stripeSessionId: session.id, email, source, offerId: offer?.id || '', membershipId: membership?.id || '', paymentOption: record.paymentOption || '', privateTestCheckout: record.paymentOption === 'test' ? 'true' : 'false' } });
  }
  return { ok: true as const, record, access };
}

export async function listAmandaPayments(portalSlug: string, email: string) {
  const rows = await listStudioRecords<AmandaPaymentRecord>('experience', syntheticOrgId(portalSlug));
  return rows.filter((row) => row?.id?.startsWith('amanda-payment-') && row.portalSlug === portalSlug && row.email === email.toLowerCase()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function updateAmandaMembershipLifecycle(subscription: Stripe.Subscription) {
  const meta = subscription.metadata ?? {}; const portalSlug = String(meta.portalSlug || '').trim().toLowerCase(); const membershipId = String(meta.amandaMembershipId || ''); const email = String(meta.clientEmail || '').trim().toLowerCase();
  if (!portalSlug.startsWith('amanda-catherine') || !membershipId || !email) return false;
  const rows = await listAmandaPayments(portalSlug, email); const match = rows.find((row) => row.membershipId === membershipId && row.stripeSubscriptionId === subscription.id); if (!match) return false;
  const next: AmandaPaymentRecord = { ...match, subscriptionStatus: subscription.status, updatedAt: new Date().toISOString() };
  await saveStudioRecord({ recordType: 'experience', id: match.id, organizationId: syntheticOrgId(portalSlug), title: `Amanda membership payment: ${membershipId}`, payload: next });
  return true;
}
