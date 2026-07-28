#!/usr/bin/env node
/**
 * Portal scheduling cert — org booking URL + Event Hub calendar embed.
 * Run: node scripts/test-portal-scheduling-cert.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const required = [
  'app/portal/[slug]/events/BookingEmbed.tsx',
  'app/portal/[slug]/events/BookingUrlPanel.tsx',
  'app/api/portal/org/booking-url/route.ts',
];

for (const rel of required) {
  assert(existsSync(join(root, rel)), `missing ${rel}`);
}

const orgs = readFileSync(join(root, 'lib/organizations.ts'), 'utf8');
assert(orgs.includes('bookingUrl'), 'Organization must include bookingUrl');
assert(orgs.includes("'Booking Url'"), 'organizations must map Booking Url Airtable field');

const eventsPage = readFileSync(join(root, 'app/portal/[slug]/events/page.tsx'), 'utf8');
assert(eventsPage.includes('BookingEmbed'), 'events page must render BookingEmbed');
assert(eventsPage.includes('BookingUrlPanel'), 'events page must render BookingUrlPanel for staff');
assert(eventsPage.includes('bookingEmbedUrl'), 'events page must resolve booking embed URL');

const api = readFileSync(join(root, 'app/api/portal/org/booking-url/route.ts'), 'utf8');
assert(api.includes('updateOrganizationWorkspaceConfig'), 'booking-url API must persist org field');
assert(api.includes('staff'), 'booking-url API must require staff');

if (failures.length) {
  console.error('FAIL portal-scheduling-cert');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS portal-scheduling-cert');
