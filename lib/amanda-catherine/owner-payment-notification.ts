import { createHash } from 'node:crypto';
import type Stripe from 'stripe';
import { AMANDA_MEMBERSHIPS, AMANDA_OFFERS } from '@/lib/amanda-catherine/config';
import { loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';
import { sendAuthEmail } from '@/lib/ea-auth-email';

const PORTAL_SLUG = 'amanda-catherine';
const OWNER_EMAIL = (process.env.AMANDA_OWNER_NOTIFICATION_EMAIL || 'amandacatherinec@gmail.com').trim().toLowerCase();

type OwnerNotificationRecord = {
  id: string;
  stripeSessionId: string;
  sentAt: string;
  ownerEmail: string;
  studentEmail: string;
  label: string;
};

function notificationId(sessionId: string) {
  return `amanda-owner-notice-${createHash('sha256').update(sessionId).digest('hex').slice(0, 24)}`;
}

function esc(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function notifyAmandaOwnerOfEnrollment(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  if (!meta.portalSlug?.toLowerCase().startsWith(PORTAL_SLUG)) {
    return { ok: false as const, error: 'Not an Amanda checkout.' };
  }

  const offer = AMANDA_OFFERS.find((item) => item.id === meta.amandaOfferId);
  const membership = AMANDA_MEMBERSHIPS.find((item) => item.id === meta.amandaMembershipId);
  if (!offer && !membership) return { ok: false as const, error: 'Amanda offer not recognized.' };

  const id = notificationId(session.id);
  const existing = await loadStudioRecord<OwnerNotificationRecord>('experience', id);
  if (existing?.sentAt) return { ok: true as const, alreadySent: true as const };

  const studentEmail = String(
    meta.clientEmail || session.customer_details?.email || session.customer_email || '',
  ).trim().toLowerCase();
  const studentName = String(session.customer_details?.name || meta.clientName || studentEmail || 'New enrollee').trim();
  const label = membership?.name ?? offer!.name;
  const amount = (session.amount_total ?? 0) / 100;
  const currency = String(session.currency || 'cad').toUpperCase();
  const paymentType = meta.paymentOption === 'test' ? 'Private $1 test' : 'Paid enrollment';

  const result = await sendAuthEmail({
    to: OWNER_EMAIL,
    subject: `New enrollment: ${label}`,
    title: 'New enrollment and payment received',
    bodyHtml: `
      <p>A new Amanda Catherine enrollment has been confirmed.</p>
      <div style="padding:18px;background:#f7f1e8;border-left:4px solid #b9894d;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Student:</strong> ${esc(studentName)}</p>
        <p style="margin:0 0 8px;"><strong>Email:</strong> ${esc(studentEmail)}</p>
        <p style="margin:0 0 8px;"><strong>Program:</strong> ${esc(label)}</p>
        <p style="margin:0 0 8px;"><strong>Payment:</strong> ${esc(`${currency} $${amount.toFixed(2)}`)}</p>
        <p style="margin:0;"><strong>Type:</strong> ${esc(paymentType)}</p>
      </div>
      <p>The learner's access is handled automatically. You can review enrollments and progress in your Amanda Catherine administrator portal.</p>
    `,
    text: `New Amanda Catherine enrollment. Student: ${studentName}. Email: ${studentEmail}. Program: ${label}. Payment: ${currency} $${amount.toFixed(2)}. Type: ${paymentType}.`,
    brandLabel: 'Amanda Catherine · AesthetiKine',
    brandColor: '#23334d',
  });

  if (!result.ok) return { ok: false as const, error: result.error || 'Owner notification email failed.' };

  const sentAt = new Date().toISOString();
  const record: OwnerNotificationRecord = {
    id,
    stripeSessionId: session.id,
    sentAt,
    ownerEmail: OWNER_EMAIL,
    studentEmail,
    label,
  };
  const saved = await saveStudioRecord({
    recordType: 'experience',
    id,
    organizationId: syntheticOrgId(PORTAL_SLUG),
    title: `Amanda owner enrollment notification: ${label}`,
    payload: record,
  });
  if (!saved.ok) {
    console.error('[amanda-owner-notice] sent but could not persist idempotency state', saved.error);
  }

  return { ok: true as const, sentAt };
}
