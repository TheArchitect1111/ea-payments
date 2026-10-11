import { createHash } from 'node:crypto';
import { airtableQuery } from '@/lib/data/airtable-client';
import { loadStudioRecordFromAirtable, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';
import Stripe from 'stripe';
import { getAmandaConfirmationLetter } from '@/lib/amanda-catherine/confirmation-letters';
import { confirmTrackingPayment, pushToTrackingPortal, type TrackingLead } from '@/lib/services/trackingPortal';

const FIXTURE_EMAIL = 'amanda-preview-qa@example.invalid';
const FIXTURE_CLASS = 'amanda-preview-dollar-test';
const FIXTURE_TITLE = 'Amanda Preview $1 Workflow Test';

function previewStripeTestKey() {
  const primary = String(process.env.STRIPE_TEST_SECRET_KEY || '').trim();
  if (primary) return primary.startsWith('sk_test_') ? primary : '';
  const fallback = String(process.env.STRIPE_SECRET_KEY || '').trim();
  return fallback.startsWith('sk_test_') ? fallback : '';
}

export function previewDollarTestGuard(host: string) {
  if (process.env.VERCEL_ENV !== 'preview' ||
      process.env.VERCEL_GIT_COMMIT_REF !== 'fix/amanda-tracking-wire' ||
      !/^[a-z0-9-]+\.vercel\.app$/.test(host)) {
    return { enabled: false, code: 404, reason: 'This endpoint is available only on the named Vercel preview branch.' };
  }
  if (!previewStripeTestKey()) {
    return { enabled: false, code: 503, reason: 'STRIPE_TEST_SECRET_KEY is missing or is not a Stripe TEST key. A live charge is prohibited.' };
  }
  return { enabled: true, code: 200, reason: 'Stripe TEST mode ready. No real funds will move.' };
}

export function previewTrackingRecordId(registrationId: string) {
  return 'amanda-tracking-test-' + createHash('sha256').update(registrationId).digest('hex').slice(0, 32);
}

type PreviewTestRecord = TrackingLead & {
  payment_status?: 'paid' | 'unpaid'; payment_reference?: string | null;
  payment_provider?: string; paid_at?: string;
  confirmation_subject?: string; confirmation_body_html?: string;
  confirmation_status?: 'rendered'; record_kind?: string;
};

export async function readPreviewDollarTest(registrationId: string) {
  if (!/^[0-9a-f-]{36}$/.test(registrationId)) return null;
  // Always read back from durable Airtable, never the in-memory Creative Studio cache.
  const record = await loadStudioRecordFromAirtable<PreviewTestRecord>(
    'experience', previewTrackingRecordId(registrationId));
  if (record?.is_test !== true || record.registration_id !== registrationId ||
      record.email !== FIXTURE_EMAIL || record.class_id !== FIXTURE_CLASS) return null;
  const realRecords = await airtableQuery('portal_registrations', {
    filterByFormula: "AND({email}='" + FIXTURE_EMAIL + "',{class_id}='" + FIXTURE_CLASS + "')",
    maxRecords: 1,
  });
  return {
    registration_id: record.registration_id,
    is_test: true as const,
    class_id: record.class_id,
    payment_status: record.payment_status || 'unpaid',
    payment_reference: record.payment_reference || null,
    payment_provider: record.payment_provider || null,
    confirmation_status: record.confirmation_status || null,
    confirmation_subject: record.confirmation_subject || null,
    confirmation_body_html: record.confirmation_body_html || null,
    isolated_from_live: realRecords.length === 0,
    source: record.source,
  };
}

export async function runPreviewDollarTest(registrationId: string) {
  // Fixed fake identity, never an actual customer or arbitrary user-supplied address.
  const gate = previewDollarTestGuard(String(process.env.VERCEL_URL || ''));
  if (!gate.enabled) throw new Error(gate.reason);
  const stripe = new Stripe(previewStripeTestKey());
  const now = new Date().toISOString();
  const lead: TrackingLead = {
    event_type: 'signup', is_test: true,
    registration_id: registrationId,
    first_name: 'Preview', last_name: 'Test', name: 'Preview Test',
    email: FIXTURE_EMAIL, phone: '',
    class_name: FIXTURE_TITLE, class_id: FIXTURE_CLASS,
    registration_type: 'live', created_at: now, timestamp: now,
    source_page: 'amandacatherine.ca', source: '/api/amanda-catherine/preview-dollar-test',
    payment_status: 'unpaid', payment_reference: null,
  };
  await pushToTrackingPortal(lead);
  const signup = await readPreviewDollarTest(registrationId);
  if (!signup || signup.payment_status !== 'unpaid' || !signup.isolated_from_live)
    throw new Error('Isolated signup was not durably confirmed.');

  // This is a REAL Stripe API call, but permitted exclusively with an sk_test_ key.
  // Never issue a real-money test charge or use a customer-supplied card.
  const payment = await stripe.paymentIntents.create({
    amount: 100, currency: 'cad',
    payment_method_types: ['card'], payment_method: 'pm_card_visa',
    confirm: true,
    description: '[TEST] Amanda Catherine full tracking flow',
    metadata: {
      registrationId, testOnly: 'true', classId: FIXTURE_CLASS,
      source: 'fix/amanda-tracking-wire/preview-dollar-test',
    },
  }, { idempotencyKey: 'amanda-preview-' + registrationId });
  if (payment.status !== 'succeeded' || payment.amount !== 100 ||
      payment.currency !== 'cad' || payment.livemode !== false)
    throw new Error('Stripe test mode did not confirm the CAD $1 payment.');

  await confirmTrackingPayment({
    event_type: 'payment_confirmed', is_test: true,
    registration_id: registrationId, email: FIXTURE_EMAIL, class_id: FIXTURE_CLASS,
    payment_status: 'paid', payment_reference: payment.id,
    payment_provider: 'stripe', timestamp: new Date().toISOString(),
  });
  const afterPayment = await readPreviewDollarTest(registrationId);
  if (!afterPayment || afterPayment.payment_status !== 'paid' ||
      afterPayment.payment_reference !== payment.id || !afterPayment.isolated_from_live)
    throw new Error('Tracking portal did not confirm the same paid test registration.');

  // Show Amanda's actual editable live confirmation template on the success page.
  // Never email a real person or pretend a message was delivered to example.invalid.
  const letter = await getAmandaConfirmationLetter('live');
  const subject = '[TEST] ' + letter.subject.replace(/{{class_name}}/g, FIXTURE_TITLE);
  const html = letter.body_html.replace(/{{first_name}}/g, 'Preview')
    .replace(/{{class_name}}/g, FIXTURE_TITLE);

  const old = await loadStudioRecordFromAirtable<PreviewTestRecord>(
    'experience', previewTrackingRecordId(registrationId));
  if (!old || old.payment_status !== 'paid') throw new Error('Confirmation proof lost its payment.');
  const saved = await saveStudioRecord({
    recordType: 'experience', id: previewTrackingRecordId(registrationId),
    organizationId: syntheticOrgId('amanda-catherine'),
    title: '[TEST] Amanda preview confirmed registration',
    payload: { ...old, confirmation_subject: subject,
      confirmation_body_html: html, confirmation_status: 'rendered' },
  });
  if (!saved.ok || !saved.persistedToAirtable)
    throw new Error('The confirmation letter could not be saved durably.');

  const receipt = await readPreviewDollarTest(registrationId);
  if (!receipt || receipt.payment_status !== 'paid' ||
      receipt.payment_reference !== payment.id ||
      receipt.confirmation_status !== 'rendered' || !receipt.isolated_from_live)
    throw new Error('Final durable tracking read-back failed.');

  return { ...receipt, stripe_mode: 'test' as const,
    amount_cad: 1, signup_confirmed: true as const,
    stripe_payment_confirmed: true as const,
    confirmation_delivery: 'rendered on preview test page, not emailed' };
}
