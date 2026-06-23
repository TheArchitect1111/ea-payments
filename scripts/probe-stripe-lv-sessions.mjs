#!/usr/bin/env node
const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('NO_STRIPE_KEY');
  process.exit(1);
}

async function stripe(path) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  return res.json();
}

const data = await stripe('checkout/sessions?limit=10&expand[]=data.payment_intent');
const lv = (data.data || []).filter(
  (s) => s.metadata?.flow === 'launch_verification' || s.metadata?.packageName === 'Launch Verification',
);
console.log(JSON.stringify(lv.map((s) => ({
  id: s.id,
  status: s.status,
  payment_status: s.payment_status,
  amount_total: s.amount_total,
  currency: s.currency,
  customer_email: s.customer_email,
  created: s.created ? new Date(s.created * 1000).toISOString() : null,
  metadata: s.metadata,
  payment_intent: typeof s.payment_intent === 'object' ? {
    id: s.payment_intent?.id,
    status: s.payment_intent?.status,
  } : s.payment_intent,
})), null, 2));
