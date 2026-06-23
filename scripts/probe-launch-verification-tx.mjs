#!/usr/bin/env node
/** One-off probe: most recent Launch Verification payment trail. */
const base = process.env.AIRTABLE_PAYMENTS_BASE_ID || 'appv0YoLIMY45fmDA';
const key = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_PAT;
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!key) {
  console.error('Missing AIRTABLE_API_KEY');
  process.exit(1);
}

async function airtable(path) {
  const res = await fetch(`https://api.airtable.com/v0/${base}/${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function main() {
  const formula = encodeURIComponent('{Package Purchased}="Launch Verification"');
  const clients = await airtable(
    `Client%20Records?maxRecords=5&sort[0][field]=Payment%20Received%20At&sort[0][direction]=desc&filterByFormula=${formula}`,
  );

  console.log('=== CLIENT RECORDS (Launch Verification) ===');
  console.log(JSON.stringify(clients, null, 2));

  const pulseTable = encodeURIComponent(process.env.PULSE_EVENTS_TABLE || 'Pulse Events');
  const pulse = await airtable(
    `${pulseTable}?maxRecords=10&sort[0][field]=Created&sort[0][direction]=desc`,
  );
  const launchEvents = (pulse.records || []).filter((r) =>
    String(r.fields['Event Type'] || '').includes('launch.verification'),
  );
  console.log('\n=== PULSE EVENTS (launch.verification*) ===');
  console.log(JSON.stringify(launchEvents.length ? launchEvents : pulse.records?.slice(0, 3), null, 2));

  if (stripeKey && clients.records?.[0]) {
    const txId = clients.records[0].fields['Stripe Transaction ID'];
    if (txId && txId.startsWith('pi_')) {
      const res = await fetch(`https://api.stripe.com/v1/payment_intents/${txId}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
      const pi = await res.json();
      console.log('\n=== STRIPE PAYMENT INTENT ===');
      console.log(
        JSON.stringify(
          {
            id: pi.id,
            status: pi.status,
            amount: pi.amount,
            currency: pi.currency,
            created: pi.created ? new Date(pi.created * 1000).toISOString() : null,
            receipt_email: pi.receipt_email,
          },
          null,
          2,
        ),
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
