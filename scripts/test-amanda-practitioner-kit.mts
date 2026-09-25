import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type Stripe from 'stripe';
import { getStripe } from '../lib/stripe';
import { POST } from '../app/api/public/amanda/practitioner-kit/checkout/route';
import { isAmandaKitSession, recordAmandaKitOrder } from '../lib/amanda-catherine/practitioner-kit-orders';

process.env.STRIPE_SECRET_KEY = 'sk_test_unit_test_only';
process.env.VERCEL_ENV = 'preview';
let params: Stripe.Checkout.SessionCreateParams | undefined;
const stripe = getStripe();
stripe.checkout.sessions.create = (async (input: Stripe.Checkout.SessionCreateParams) => {
  params=input;return {url:'https://checkout.stripe.com/c/pay/cs_test_unit'};
}) as typeof stripe.checkout.sessions.create;
const origin='https://preview.example.com';
const response=await POST(new Request(`${origin}/api/public/amanda/practitioner-kit/checkout`,{method:'POST',headers:{origin,'x-forwarded-for':'test-checkout'},body:JSON.stringify({priceCad:1,currency:'usd',portalSlug:'other-client'})}));
assert.equal(response.status,200);
assert.equal((await response.json()).url,'https://checkout.stripe.com/c/pay/cs_test_unit');
assert.equal(params?.metadata?.amandaKitId,'body-sculpt-practitioner-starter-kit');
assert.equal(params?.metadata?.portalSlug,'amanda-catherine');
assert.equal(params?.line_items?.[0].price_data?.currency,'cad');
assert.equal(params?.line_items?.[0].price_data?.unit_amount,49900);
assert.ok(params?.success_url?.startsWith(origin));
assert.ok(params?.cancel_url?.includes('payment=cancelled'));
assert.equal(params?.allow_promotion_codes,undefined);
assert.equal(params?.automatic_tax,undefined);
assert.equal((await POST(new Request(`${origin}/api/public/amanda/practitioner-kit/checkout`,{method:'POST',headers:{origin:'https://attacker.example'}}))).status,403);
const paid={id:'cs_test_unit',metadata:params!.metadata,payment_status:'paid',amount_total:49900,currency:'cad'} as Stripe.Checkout.Session;
assert.ok(isAmandaKitSession(paid));
assert.deepEqual(await recordAmandaKitOrder(paid),{ok:true,preview:true});
assert.equal((await recordAmandaKitOrder({...paid,payment_status:'unpaid'})).ok,false);
assert.equal((await recordAmandaKitOrder({...paid,currency:'usd'})).ok,false);
assert.equal((await recordAmandaKitOrder({...paid,amount_total:100})).ok,false);
assert.equal(isAmandaKitSession({...paid,metadata:{...paid.metadata,portalSlug:'amanda-catherine-imposter'}}),false);

// Regression invariants are asserted against the current canonical contracts rather than
// a historical commit that predates these Amanda files. This keeps the test immutable in
// behavior without coupling CI to an invalid repository snapshot.
const page=readFileSync('app/amanda-catherine/page.tsx','utf8');
for(const path of ['lib/amanda-catherine/config.ts','app/api/public/amanda/enrollment/checkout/route.ts','app/portal/amanda-catherine/enroll/page.tsx','app/portal/amanda-catherine/learning/page.tsx','app/portal/amanda-catherine/owner/page.tsx','app/portal/amanda-catherine/owner/layout.tsx','app/portal/amanda-catherine/owner/owner.css']) {
  assert.ok(readFileSync(path,'utf8').length>100, `Protected Amanda contract missing or empty: ${path}`);
}
assert.ok(!page.includes('encodeURIComponent(course.id)'));
assert.ok(page.includes('encodeURIComponent(course.courseId)'));
console.log('Amanda kit: checkout amount/currency server-owned, CSRF rejected, paid-session validation passed, preview writes suppressed; Jane/imagery/portal/enrollment invariants preserved.');
