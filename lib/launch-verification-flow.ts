import type Stripe from 'stripe';
import { createOrUpdateClientRecord } from '@/lib/airtable';
import { sendWelcomeEmail, sendAdminNotification } from '@/lib/email';
import { fireOnboardingWebhook } from '@/lib/make-webhooks';
import {
  LAUNCH_VERIFICATION_AIRTABLE_PACKAGE,
  LAUNCH_VERIFICATION_ONBOARDING_STATUS,
  LAUNCH_VERIFICATION_PRODUCT_NAME,
} from '@/lib/launch-verification';
import { emitPulseEvent } from '@/lib/pulse-bus';

function logLaunchVerificationTransaction(payload: Record<string, unknown>): void {
  console.info('[launch-verification]', JSON.stringify({ ...payload, at: new Date().toISOString() }));
}

export async function handleLaunchVerificationPayment(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const meta = session.metadata ?? {};
  const customerDetails = session.customer_details;

  const clientName = meta.clientName || customerDetails?.name || 'Launch Verification Tester';
  const email = customerDetails?.email || session.customer_email || meta.email || '';

  if (!email) {
    console.error('[launch-verification] No email on session:', session.id);
    return;
  }

  const amountPaid = (session.amount_total ?? 0) / 100;
  const paymentDate = session.created
    ? new Date(session.created * 1000).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const paymentReceivedAt = session.created
    ? new Date(session.created * 1000).toISOString()
    : new Date().toISOString();
  const stripeTransactionId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? session.id;

  logLaunchVerificationTransaction({
    event: 'payment.received',
    stripeSessionId: session.id,
    stripeTransactionId,
    email,
    clientName,
    amountPaid,
  });

  const airtableResult = await createOrUpdateClientRecord({
    clientName,
    organization: meta.organization || undefined,
    email,
    phone: meta.phone || customerDetails?.phone || undefined,
    packagePurchased: LAUNCH_VERIFICATION_AIRTABLE_PACKAGE,
    amountPaid,
    paymentDate,
    stripeTransactionId,
    portalAccessStatus: 'Pending',
    onboardingStatus: LAUNCH_VERIFICATION_ONBOARDING_STATUS,
    paymentReceivedAt,
  });

  if (!airtableResult.ok) {
    console.error('[launch-verification] Airtable failed:', session.id, airtableResult.error);
    await emitPulseEvent({
      product: 'ea-platform',
      type: 'onboarding.blocked',
      title: `Launch Verification — Airtable failed for ${clientName}`,
      detail: airtableResult.error ?? 'Client record not created',
      priority: 'critical',
      href: '/admin/dashboard',
      metadata: { stripeSessionId: session.id, email, flow: 'launch_verification' },
    });
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.efficiencyarchitects.online';
  const portalLoginUrl = `${baseUrl}/portal/login`;

  try {
    const welcomeResult = await sendWelcomeEmail({
      clientName,
      email,
      packageName: LAUNCH_VERIFICATION_PRODUCT_NAME,
      portalLoginUrl,
      platformName: 'Efficiency Architects — Launch Verification',
    });
    if (!welcomeResult.ok) {
      console.error('[launch-verification] Welcome email failed:', welcomeResult.error);
    }
  } catch (err) {
    console.error('[launch-verification] Welcome email threw:', err);
  }

  try {
    const adminResult = await sendAdminNotification({
      clientName,
      organization: meta.organization || undefined,
      email,
      packageName: LAUNCH_VERIFICATION_PRODUCT_NAME,
      amountPaid,
      paymentDate,
      paymentMethodTypes: session.payment_method_types ?? [],
      stripeTransactionId,
      airtableRecordId: airtableResult.recordId,
    });
    if (!adminResult.ok) {
      console.error('[launch-verification] Admin notification failed:', adminResult.error);
    }
  } catch (err) {
    console.error('[launch-verification] Admin notification threw:', err);
  }

  await fireOnboardingWebhook({
    event: 'payment.received',
    clientName,
    email,
    organization: meta.organization || undefined,
    packageName: LAUNCH_VERIFICATION_PRODUCT_NAME,
    amountPaid,
    paymentDate,
    stripeTransactionId,
    airtableRecordId: airtableResult.recordId,
    portalLoginUrl,
  });

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'launch.verification.completed',
    title: `Launch Verification payment — ${clientName}`,
    detail: `$${amountPaid.toFixed(2)} USD · ${email} · onboarding task created`,
    priority: 'high',
    href: '/admin/dashboard',
    objectId: airtableResult.recordId,
    metadata: {
      stripeSessionId: session.id,
      stripeTransactionId,
      email,
      flow: 'launch_verification',
    },
  });

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'attention.critical',
    title: `Onboarding task: Launch Verification — ${clientName}`,
    detail: 'Review Client Record and confirm welcome email + Make webhook history.',
    priority: 'high',
    href: airtableResult.recordId
      ? `/admin/dashboard`
      : '/launch',
    objectId: airtableResult.recordId,
    metadata: {
      task: 'launch_verification_onboarding',
      airtableRecordId: airtableResult.recordId ?? '',
    },
  });

  logLaunchVerificationTransaction({
    event: 'payment.processed',
    stripeSessionId: session.id,
    airtableRecordId: airtableResult.recordId,
    onboardingStatus: LAUNCH_VERIFICATION_ONBOARDING_STATUS,
  });
}
