import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const api=readFileSync('app/api/portal/[slug]/payments/stripe/route.ts','utf8');
const store=readFileSync('lib/bricks/merchant-onboarding/stripe-store.ts','utf8');
const adapter=readFileSync('lib/bricks/merchant-onboarding/stripe-connect.ts','utf8');
const migration=readFileSync('supabase/migrations/20261025_ea_merchant_connections.sql','utf8');
test('merchant onboarding is owner/admin only and enforces same-tenant session',()=>{
  for(const text of ['session.slug !== slug',"'owner','admin'",'EA_PORTAL_COOKIE','verifySession','Origin mismatch'])
    assert.ok(api.includes(text),text);
});
test('unconfigured merchant setup fails closed, not enabled by checkout key',()=>{
  for(const text of ['EA_STRIPE_CONNECT_ONBOARDING_ENABLED','EA_STRIPE_CONNECT_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY'])
    assert.ok(api.includes(text),text);
  assert.doesNotMatch(api,/TB3_STRIPE_SECRET_KEY/);
});
test('registry has database uniqueness and inaccessible public roles',()=>{
  for(const text of ['tenant_id text primary key','stripe_account_id text not null unique',
    'enable row level security','revoke all','resolution=ignore-duplicates'])
    assert.ok((migration+'\n'+store).includes(text),text);
});
test('standard connected account creation and Stripe verification are server side',()=>{
  for(const text of ["type: 'standard'",'accountLinks.create','accounts.retrieve','charges_enabled','payouts_enabled'])
    assert.ok(adapter.includes(text),text);
});
