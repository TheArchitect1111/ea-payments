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
  for(const text of ['EA_STRIPE_CONNECT_ONBOARDING_ENABLED','EA_STRIPE_CONNECT_SECRET_KEY','EA_MERCHANT_DATABASE_URL'])
    assert.ok(api.includes(text),text);
  assert.doesNotMatch(api,/TB3_STRIPE_SECRET_KEY/);
});
test('registry has database uniqueness and inaccessible public roles',()=>{
  for(const text of ['tenant_id text primary key','stripe_account_id text not null unique',
    'enable row level security','revoke all','ON CONFLICT (tenant_id) DO NOTHING'])
    assert.ok((migration+'\n'+store).includes(text),text);
});
test('standard connected account creation and Stripe verification are server side',()=>{
  for(const text of ["type: 'standard'",'accountLinks.create','accounts.retrieve','charges_enabled','payouts_enabled'])
    assert.ok(adapter.includes(text),text);
});

test('merchant store never falls back to shared People or Simplifi databases',()=>{
  assert.ok(store.includes('EA_MERCHANT_DATABASE_URL'));
  assert.ok(store.includes('ea_merchant_api'));
  assert.ok(store.includes('rejectUnauthorized:true'));
  assert.doesNotMatch(store,/SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|simplifi-os/);
});

test('existing Stripe test key fallback is isolated to preview and requires explicit opt-in',()=>{
  assert.ok(adapter.includes("process.env.VERCEL_ENV === 'preview'"));
  assert.ok(adapter.includes("EA_STRIPE_CONNECT_USE_EXISTING_TEST_KEY === 'true'"));
  assert.ok(adapter.includes("process.env.VERCEL_ENV === 'production' ? 'sk_live_' : 'sk_test_'"));
  assert.ok(api.includes("EA_STRIPE_CONNECT_USE_EXISTING_TEST_KEY === 'true'"));
});

test('existing mapping cannot onboard non-Standard account',()=>{
  assert.ok(adapter.includes("account.type !== 'standard'"));
});

test('onboarding configuration matches live credentials to production and test credentials to preview',()=>{
  assert.ok(api.includes("process.env.VERCEL_ENV === 'production' ? 'sk_live_' : 'sk_test_'"));
  assert.ok(api.includes("STRIPE_TEST_SECRET_KEY?.startsWith('sk_test_')"));
  assert.ok(adapter.includes('Stripe Connect key does not match deployment environment'));
});

test('TB3 public status does not disclose merchant account identifiers',()=>{
  const status = api.split('async function tb3DirectStatus')[1]?.split('async function tb3DirectOnboard')[0];
  assert.ok(status,'TB3 status handler must exist');
  assert.doesNotMatch(status,/\b(?:accountId|storedAccountId)\s*:/);
  assert.ok(api.includes("if (slug === 'tarris') return tb3DirectStatus(sandbox);"));
});

test('non-TB3 tenants retain authorized Connect onboarding',()=>{
  assert.ok(api.includes("if (slug === 'tarris') return tb3DirectOnboard(req);"));
  assert.ok(api.includes("if (slug !== 'tarris' && !await authorize(slug)"));
  assert.ok(api.includes('const linked = await startStripeOnboarding({'));
});
