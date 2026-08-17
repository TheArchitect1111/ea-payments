import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

const access = read('lib/amanda-catherine/client-access.ts');
const store = read('lib/amanda-catherine/delivery-store.ts');
const route = read('app/api/portal/amanda/deliveries/route.ts');
const openRoute = read('app/api/portal/amanda/deliveries/[id]/open/route.ts');
const center = read('app/portal/[slug]/deliveries/AmandaDeliveryCenter.tsx');
const member = read('app/portal/[slug]/member/AmandaMemberHome.tsx');
const payment = read('lib/amanda-catherine/payment-fulfillment.ts');
const airtable = read('lib/airtable.ts');

assert.match(access, /setPortalCredentials\(record\.id, AMANDA_PORTAL_SLUG/);
assert.match(access, /createMembership\(\{ userEmail: email, organizationId: orgId, role: 'guest' \}\)/);
assert.match(access, /Your Amanda Catherine private portal is ready/);
assert.match(access, /Only content assigned to your email address/);
assert.match(access, /audience: input\.audience/);

assert.match(store, /recipientEmail: string/);
assert.match(store, /row\.recipientEmail === email/);
assert.match(store, /openedAt: current\.openedAt \|\| now/);

assert.match(route, /admin \? undefined : auth\.session\.email/);
assert.match(route, /Amanda administrator access required/);
assert.match(route, /provisionAmandaClientAccess/);
assert.match(openRoute, /delivery\.recipientEmail !== email/);
assert.match(openRoute, /markAmandaDeliveryOpened/);

assert.match(center, /Deliver to private portal/);
assert.match(center, /Only items assigned to/);
assert.match(center, /Delivery tracking/i);
assert.match(member, /media-delivery.*deliveries/);
assert.match(payment, /provisionAmandaClientAccess/);

assert.match(airtable, /isAmandaTenant \? 100 : 1/);
assert.match(airtable, /ownerEmails\.has/);

console.log('Amanda client delivery Phase 1 contracts: PASS');
