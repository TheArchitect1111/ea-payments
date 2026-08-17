import { createHash } from 'node:crypto';
import type Stripe from 'stripe';
import { AMANDA_MEMBERSHIPS, AMANDA_OFFERS } from '@/lib/amanda-catherine/config';
import {
  listStudioRecords,
  loadStudioRecord,
  saveStudioRecord,
} from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';
import { emitPulseEvent } from '@/lib/pulse-bus';
import { sendPaymentConfirmationEmail } from '@/lib/email';
import { provisionAmandaClientAccess } from '@/lib/amanda-catherine/client-access';
import type { AmandaPortalAudience } from '@/lib/amanda-catherine/config';

export type AmandaPaymentRecord = {
  id: string;
  portalSlug: string;
  email: string;
  stripeSessionId: string;
  kind: 'offer' | 'membership';
  offerId?: string;
  courseId?: string;
  membershipId?: string;
  paymentOption?: 'full' | 'deposit';
  amountPaidCad: number;
  currency: string;
  paymentStatus: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  recordedAt: string;
  updatedAt: string;
};

function recordId(stripeSessionId: string) {
  return `amanda-payment-${createHash('sha256').update(stripeSessionId).digest('hex').slice(0, 24)}`;
}

function paymentEmail(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  return (
    meta.clientEmail ||
    session.customer_details?.email ||
    session.customer_email ||
    ''
  ).trim().toLowerCase();
}

function stringId(value: string | { id?: string } | null | undefined) {
  if (typeof value === 'string') return value;
  return value?.id || undefined;
}

export function isAmandaCheckoutSession(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  return Boolean(
    meta.portalSlug?.toLowerCase().startsWith('amanda-catherine') &&
      (meta.amandaOfferId || meta.amandaMembershipId),
  );
}

export async function fulfillAmandaCheckout(
  session: Stripe.Checkout.Session,
  source: 'webhook' | 'return-verification',
) {
  const meta = session.metadata ?? {};
  const portalSlug = String(meta.portalSlug || '').trim().toLowerCase();
  const email = paymentEmail(session);
  if (!portalSlug.startsWith('amanda-catherine') || !email) {
    return { ok: false as const, error: 'Amanda payment identity is incomplete.' };
  }

  const offer = AMANDA_OFFERS.find((item) => item.id === meta.amandaOfferId);
  const membership = AMANDA_MEMBERSHIPS.find((item) => item.id === meta.amandaMembershipId);
  if (!offer && !membership) {
    return { ok: false as const, error: 'Amanda offer or membership was not recognized.' };
  }
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    return { ok: false as const, error: 'Stripe has not confirmed this payment.' };
  }

  const id = recordId(session.id);
  const existing = await loadStudioRecord<AmandaPaymentRecord>('experience', id);
  const now = new Date().toISOString();
  const record: AmandaPaymentRecord = {
    id,
    portalSlug,
    email,
    stripeSessionId: session.id,
    kind: membership ? 'membership' : 'offer',
    offerId: offer?.id,
    courseId: String(meta.amandaCourseId || ('courseId' in (offer || {}) ? (offer as { courseId?: string }).courseId || '' : '')) || undefined,
    membershipId: membership?.id,
    paymentOption:
      meta.paymentOption === 'deposit' || meta.paymentOption === 'full'
        ? meta.paymentOption
        : undefined,
    amountPaidCad: (session.amount_total ?? 0) / 100,
    currency: String(session.currency || 'cad').toUpperCase(),
    paymentStatus: session.payment_status,
    stripeCustomerId: stringId(session.customer),
    stripeSubscriptionId: stringId(session.subscription),
    subscriptionStatus: membership ? 'active' : undefined,
    recordedAt: existing?.recordedAt ?? now,
    updatedAt: now,
  };

  const saved = await saveStudioRecord({
    recordType: 'experience',
    id,
    organizationId: syntheticOrgId(portalSlug),
    title: membership
      ? `Amanda membership payment: ${membership.name}`
      : `Amanda offer payment: ${offer!.name}`,
    payload: record,
  });
  if (!saved.ok) return { ok: false as const, error: saved.error || 'Payment record could not be saved.' };

  const audience: AmandaPortalAudience = membership
    ? 'member-community-participant'
    : offer?.id === 'lifeline-artist-business-launch'
      ? 'media-guest'
      : offer?.id.includes('training') || offer?.id.includes('certification')
        ? 'student-trainee'
        : 'client';
  const access = await provisionAmandaClientAccess({
    email,
    name: session.customer_details?.name || String(meta.clientName || ''),
    audience,
    amountPaidCad: record.amountPaidCad,
    transactionId: stringId(session.payment_intent) || session.id,
    courseIds: record.courseId ? [record.courseId] : [],
  });
  if (!access.ok) {
    console.error('[amanda-payment] client portal access provisioning failed', access.error);
    await emitPulseEvent({
        product: 'ea-platform',
        type: 'fulfillment.review_required',
        title: 'Amanda client access needs attention',
        detail: `${email} · ${access.error}`,
        priority: 'high',
        href: `/portal/${portalSlug}/deliveries`,
        tenantId: portalSlug,
        objectId: id,
    });
    return { ok: false as const, error: access.error || 'Student access could not be provisioned.', paymentRecorded: true as const };
  }

  if (!existing) {
    const label = membership?.name ?? offer!.name;
    try {
      await sendPaymentConfirmationEmail({
        email,
        clientName: email,
        packageName: label,
        amountPaid: record.amountPaidCad,
        paymentDate: now.slice(0, 10),
        portalUrl: `/portal/${portalSlug}/billing`,
        stripeTransactionId: stringId(session.payment_intent) || session.id,
      });
    } catch (error) {
      console.error('[amanda-payment] confirmation email failed', error);
    }
    await emitPulseEvent({
      product: 'ea-platform',
      type: membership ? 'subscription.started' : 'payment.received',
      title: membership ? `Amanda membership active — ${label}` : `Amanda payment received — ${label}`,
      detail: `CAD $${record.amountPaidCad.toFixed(2)} · ${email}`,
      priority: 'high',
      href: `/portal/${portalSlug}/billing`,
      tenantId: portalSlug,
      objectId: id,
      metadata: {
        stripeSessionId: session.id,
        email,
        source,
        offerId: offer?.id || '',
        membershipId: membership?.id || '',
        paymentOption: record.paymentOption || '',
      },
    });
  }

  return { ok: true as const, record, access };
}

export async function listAmandaPayments(portalSlug: string, email: string) {
  const rows = await listStudioRecords<AmandaPaymentRecord>('experience', syntheticOrgId(portalSlug));
  return rows
    .filter(
      (row) =>
        row?.id?.startsWith('amanda-payment-') &&
        row.portalSlug === portalSlug &&
        row.email === email.toLowerCase(),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function updateAmandaMembershipLifecycle(subscription: Stripe.Subscription) {
  const meta = subscription.metadata ?? {};
  const portalSlug = String(meta.portalSlug || '').trim().toLowerCase();
  const membershipId = String(meta.amandaMembershipId || '');
  const email = String(meta.clientEmail || '').trim().toLowerCase();
  if (!portalSlug.startsWith('amanda-catherine') || !membershipId || !email) return false;

  const rows = await listAmandaPayments(portalSlug, email);
  const match = rows.find(
    (row) => row.membershipId === membershipId && row.stripeSubscriptionId === subscription.id,
  );
  if (!match) return false;
  const next: AmandaPaymentRecord = {
    ...match,
    subscriptionStatus: subscription.status,
    updatedAt: new Date().toISOString(),
  };
  await saveStudioRecord({
    recordType: 'experience',
    id: match.id,
    organizationId: syntheticOrgId(portalSlug),
    title: `Amanda membership payment: ${membershipId}`,
    payload: next,
  });
  return true;
}
