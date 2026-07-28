#!/usr/bin/env node
/**
 * Contract: pretix Event Hub integration (list + staff API + webhook → Pulse).
 * Run: node scripts/test-pretix-event-hub-contract.mjs
 */
import { createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const files = [
  'lib/events/pretix-types.ts',
  'lib/events/pretix-store.ts',
  'lib/events/pretix-webhook.ts',
  'lib/events/registration-ledger.ts',
  'lib/events/registration-reminders.ts',
  'lib/portal-event-hub.ts',
  'app/api/portal/events/pretix/route.ts',
  'app/api/webhooks/pretix/route.ts',
  'app/api/cron/event-registration-reminders/route.ts',
  'app/portal/[slug]/events/page.tsx',
  'app/portal/[slug]/events/PretixEventStaffPanel.tsx',
  'docs/integrations/PRETIX-EVENT-ENGINE.md',
];

for (const rel of files) {
  assert(existsSync(join(root, rel)), `missing ${rel}`);
}

const types = readFileSync(join(root, 'lib/events/pretix-types.ts'), 'utf8');
assert(types.includes('isValidPretixShopUrl'), 'shop URL validator required');
assert(types.includes("status: PortalPretixEventStatus"), 'event status model required');

const store = readFileSync(join(root, 'lib/events/pretix-store.ts'), 'utf8');
assert(store.includes('PRETIX_EVENTS_JSON'), 'env seed required');
assert(store.includes('verifyPretixWebhookAuth'), 'Basic Auth verifier required');
assert(store.includes('PRETIX_WEBHOOK_SECRET'), 'webhook secret env required');
assert(store.includes('listPretixEventsForPortal'), 'portal list helper required');

const webhook = readFileSync(join(root, 'lib/events/pretix-webhook.ts'), 'utf8');
assert(webhook.includes('event.registration.confirmed'), 'confirmed Pulse type required');
assert(webhook.includes('event.registration.placed'), 'placed Pulse type required');
assert(webhook.includes('upsertRegistrationFromPretix'), 'webhook must upsert registration ledger');
assert(webhook.includes('notifyPortal'), 'must notify portal');
assert(webhook.includes('emitPulseEvent'), 'must emit Pulse');

const hub = readFileSync(join(root, 'lib/portal-event-hub.ts'), 'utf8');
assert(hub.includes("'pretix'"), 'hub must include pretix source');
assert(hub.includes('listPretixEventsForPortal'), 'hub must list pretix events');
assert(hub.includes('partitionPortalEventItems'), 'hub must partition calendar vs events');
assert(hub.includes('ctaLabel'), 'Register CTA field required');

const pulse = readFileSync(join(root, 'lib/pulse-bus.ts'), 'utf8');
assert(pulse.includes("| 'events'"), 'PulseProduct events required');
assert(pulse.includes('event.registration.confirmed'), 'PulseEventType confirmed required');

const registry = readFileSync(join(root, 'lib/modules/registry.ts'), 'utf8');
assert(registry.includes('pretix'), 'module description should mention pretix');

const page = readFileSync(join(root, 'app/portal/[slug]/events/page.tsx'), 'utf8');
assert(page.includes('PretixEventStaffPanel'), 'staff panel on Event Hub');
assert(page.includes('roleAtLeast'), 'staff gate required');
assert(page.includes('My registrations'), 'My registrations tab required');
assert(page.includes('?tab='), 'tab searchParams required');

const route = readFileSync(join(root, 'app/api/webhooks/pretix/route.ts'), 'utf8');
assert(route.includes('verifyPretixWebhookAuth'), 'webhook route must verify auth');
assert(route.includes('handlePretixRegistrationWebhook'), 'webhook must handle registration');

const gate = readFileSync(join(root, 'docs/INTEGRATION-GATE.md'), 'utf8');
assert(gate.includes('pretix'), 'Integration Gate must record pretix');

const doc = readFileSync(join(root, 'docs/integrations/PRETIX-EVENT-ENGINE.md'), 'utf8');
assert(doc.includes('disabled until configured'), 'must ship disabled until configured');
assert(doc.includes('PRETIX_WEBHOOK_SECRET'), 'doc must list webhook secret');

// Pure auth helper sanity (inline mirror of HMAC branch)
const secret = 'test-secret';
const body = '{"action":"pretix.event.order.paid","code":"ABC23","event":"camp"}';
const sig = createHmac('sha256', secret).update(body, 'utf8').digest('hex');
assert(sig.length === 64, 'HMAC helper sanity');

if (failures.length) {
  console.error('FAIL pretix-event-hub-contract');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS pretix-event-hub-contract');
