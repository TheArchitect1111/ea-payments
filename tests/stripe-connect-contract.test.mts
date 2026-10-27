import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync('lib/bricks/merchant-onboarding/stripe-connect.ts','utf8');

test('Stripe Connect adapter never uses EA service checkout keys',()=>{
 assert.match(code,/EA_STRIPE_CONNECT_SECRET_KEY/);
 assert.doesNotMatch(code,/process\.env\.STRIPE_SECRET_KEY/);
 assert.doesNotMatch(code,/TB3_STRIPE_SECRET_KEY/);
});
test('tenant isolation, atomic mapping, official Stripe onboarding and return origin checks',()=>{
 for(const term of ['store.putIfAbsent','store.get(tenantId)','account.metadata?.ea_tenant_id !== tenantId','accountLinks.create','account_onboarding','url.origin !== trustedOrigin']){
  assert.ok(code.includes(term),term);
 }
});
test('readiness checks Stripe account server-side, not a return redirect',()=>{
 for(const term of ['stripe.accounts.retrieve(accountId)','account.charges_enabled','account.payouts_enabled','account.details_submitted']){
  assert.ok(code.includes(term),term);
 }
});
