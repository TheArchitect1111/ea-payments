import Stripe from 'stripe';

const CONTRACTS_BASE_ID = 'appnyHBarTuXIG9Ke';
const CONTRACTS_TABLE = 'EA Contracts';
const TARRIS_RECORD_ID = 'recd9zuiS7lDhBLAm';
const TARRIS_OFFER_ID = 'tarris_bouie_deposit';

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY || ''}`,
    'Content-Type': 'application/json',
  };
}

function recordUrl() {
  return `https://api.airtable.com/v0/${CONTRACTS_BASE_ID}/${encodeURIComponent(CONTRACTS_TABLE)}/${TARRIS_RECORD_ID}`;
}

export async function tarrisContractStoreReadiness(): Promise<{ ok: boolean; detail?: string }> {
  if (!process.env.AIRTABLE_API_KEY) return { ok: false, detail: 'AIRTABLE_API_KEY missing' };
  try {
    const res = await fetch(recordUrl(), { headers: headers(), cache: 'no-store' });
    if (!res.ok) return { ok: false, detail: `Airtable ${res.status}` };
    const data = (await res.json()) as { fields?: Record<string, unknown> };
    const slug = String(data.fields?.['Client Slug'] || '').toLowerCase();
    return slug === 'tarris-bouie' ? { ok: true } : { ok: false, detail: 'Tarris contract record mismatch' };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : 'Airtable read failed' };
  }
}

export async function syncTarrisContractPayment(session: Stripe.Checkout.Session): Promise<{ ok: boolean; error?: string }> {
  const meta = session.metadata || {};
  if (session.payment_status !== 'paid') return { ok: false, error: 'Stripe session is not paid' };
  if (String(meta.commerceOfferId || meta.packageId || '') !== TARRIS_OFFER_ID) return { ok: false, error: 'Unexpected Stripe offer' };
  if ((session.amount_total || 0) !== 50000) return { ok: false, error: 'Unexpected payment amount' };
  if (!process.env.AIRTABLE_API_KEY) return { ok: false, error: 'AIRTABLE_API_KEY missing' };

  try {
    const currentRes = await fetch(recordUrl(), { headers: headers(), cache: 'no-store' });
    if (!currentRes.ok) return { ok: false, error: `Unable to read EA contract record (${currentRes.status})` };
    const current = (await currentRes.json()) as { fields?: Record<string, unknown> };
    const fields = current.fields || {};
    if (String(fields['Client Slug'] || '').toLowerCase() !== 'tarris-bouie') return { ok: false, error: 'Contract record mismatch' };

    let audit: Record<string, unknown> = {};
    try { audit = JSON.parse(String(fields['Audit JSON'] || '{}')); } catch { audit = {}; }

    const paidAt = new Date().toISOString();
    const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || '';
    audit.payment = {
      provider: 'stripe',
      status: 'PAID',
      amount: 500,
      currency: String(session.currency || 'usd').toUpperCase(),
      paidAt,
      checkoutSessionId: session.id,
      paymentIntentId: paymentIntent,
      verifiedServerSide: true,
    };

    const patch = await fetch(recordUrl(), {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({
        fields: {
          'Payment Status': 'PAID',
          'Audit JSON': JSON.stringify(audit),
        },
        typecast: true,
      }),
    });
    if (!patch.ok) return { ok: false, error: `Unable to update EA contract record (${patch.status})` };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Contract payment sync failed' };
  }
}
