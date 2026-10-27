import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const store=readFileSync('lib/bricks/merchant-onboarding/stripe-store.ts','utf8');
const route=readFileSync('app/api/portal/[slug]/payments/stripe/route.ts','utf8');
test('restricted database identity and TLS enforced',()=>{
 assert.match(store,/EA_MERCHANT_DATABASE_URL/);
 assert.match(store,/ea_merchant_api/);
 assert.match(store,/rejectUnauthorized:true/);
 assert.match(store,/connectionTimeoutMillis:5000/);
 assert.ok(!store.includes('EA_MERCHANT_DB_SERVICE_KEY'));
 assert.ok(!store.includes('PEOPLE_SUPABASE'));
 assert.ok(route.includes('EA_MERCHANT_DATABASE_URL'));
});
test('tenant mapping uses bound SQL parameters and conflict-safe insert',()=>{
 assert.ok(store.includes('WHERE tenant_id=$1'));
 assert.ok(store.includes('VALUES ($1,$2)'));
 assert.ok(store.includes('ON CONFLICT (tenant_id) DO NOTHING'));
});

test('connection URL cannot override TLS certificate verification',()=>{
 assert.ok(store.includes("url.searchParams.delete('sslmode')"));
 assert.ok(store.includes("url.searchParams.delete('sslrootcert')"));
 assert.ok(store.includes("rejectUnauthorized:true"));
});
