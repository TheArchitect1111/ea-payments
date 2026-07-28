#!/usr/bin/env node
/**
 * Mandatory Event Hub cert — tabs, ledger, reminders, Launch Edition entitlements.
 * Run: node scripts/test-event-hub-mandatory-cert.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const requiredFiles = [
  'lib/events/registration-ledger.ts',
  'lib/events/registration-reminders.ts',
  'app/api/cron/event-registration-reminders/route.ts',
  'app/portal/[slug]/events/page.tsx',
  'app/portal/[slug]/settings/page.tsx',
  'vendor/payments-contract/src/presets.ts',
];

for (const rel of requiredFiles) {
  assert(existsSync(join(root, rel)), `missing ${rel}`);
}

const page = readFileSync(join(root, 'app/portal/[slug]/events/page.tsx'), 'utf8');
assert(page.includes('Calendar'), 'events page must include Calendar tab label');
assert(page.includes('Events'), 'events page must include Events tab label');
assert(page.includes('My registrations'), 'events page must include My registrations tab');
assert(page.includes('?tab='), 'events page must use tab= searchParams');
assert(page.includes('ep-hub-tabs'), 'events page must render ep-hub-tabs');
assert(page.includes('listRegistrationsForPortal'), 'events page must list registration ledger');
assert(page.includes('partitionPortalEventItems'), 'events page must partition calendar vs events');

const hub = readFileSync(join(root, 'lib/portal-event-hub.ts'), 'utf8');
assert(hub.includes('partitionPortalEventItems'), 'portal-event-hub must partition items');
assert(hub.includes('CALENDAR_EVENT_SOURCES'), 'portal-event-hub must define calendar sources');

const webhook = readFileSync(join(root, 'lib/events/pretix-webhook.ts'), 'utf8');
assert(webhook.includes('upsertRegistrationFromPretix'), 'pretix-webhook must upsert ledger rows');

const reminders = readFileSync(join(root, 'lib/events/registration-reminders.ts'), 'utf8');
assert(reminders.includes('processDueEventRegistrationReminders'), 'reminders processor required');
assert(reminders.includes('markRegistrationReminderSent'), 'reminders must mark sent');
assert(reminders.includes('event.registration.reminder'), 'reminders must use Pulse reminder type');

const cron = readFileSync(join(root, 'app/api/cron/event-registration-reminders/route.ts'), 'utf8');
assert(cron.includes('CRON_SECRET') || cron.includes('authorized'), 'cron route must authorize');
assert(cron.includes('dryRun'), 'cron route must support dryRun query');

const pulse = readFileSync(join(root, 'lib/pulse-bus.ts'), 'utf8');
assert(pulse.includes('event.registration.reminder'), 'PulseEventType must include reminder');

const presets = readFileSync(join(root, 'vendor/payments-contract/src/presets.ts'), 'utf8');
assert(presets.includes('LAUNCH_EDITION_MODULES'), 'presets must export LAUNCH_EDITION_MODULES');
assert(presets.includes('ensureLaunchEditionModules'), 'presets must export ensureLaunchEditionModules');
assert(presets.includes("'settings'"), 'Launch Edition must include settings');
assert(presets.includes("'events'"), 'Launch Edition must include events');
assert(presets.includes("'billing'"), 'Launch Edition must include billing');

const registry = readFileSync(join(root, 'lib/modules/registry.ts'), 'utf8');
assert(registry.includes("'settings'"), 'module registry must include settings module');

const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');
assert(vercel.includes('event-registration-reminders'), 'vercel.json must schedule reminder cron');

const pretixStore = readFileSync(join(root, 'lib/events/pretix-store.ts'), 'utf8');
const registrationLedger = readFileSync(join(root, 'lib/events/registration-ledger.ts'), 'utf8');
const eventHubAirtable = readFileSync(join(root, 'lib/events/event-hub-airtable.ts'), 'utf8');
assert(pretixStore.includes('platformStoreConfigured'), 'pretix-store must gate on platformStoreConfigured');
assert(pretixStore.includes('upsertPretixEventToAirtable'), 'pretix-store must upsert to Airtable');
assert(registrationLedger.includes('upsertRegistrationToAirtable'), 'registration-ledger must upsert to Airtable');
assert(eventHubAirtable.includes('Portal Pretix Events'), 'event-hub-airtable must define Portal Pretix Events table');
assert(eventHubAirtable.includes('Registration Key'), 'event-hub-airtable must define Registration Key upsert');
assert(eventHubAirtable.includes('registrationKey'), 'event-hub-airtable must export registrationKey helper');

if (failures.length) {
  console.error('FAIL event-hub-mandatory-cert');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS event-hub-mandatory-cert');
