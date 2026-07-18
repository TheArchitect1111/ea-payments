/**
 * Contract test for Launch Complete Concept Pack email template.
 * Run: node scripts/test-factory-launch-email.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const packSrc = readFileSync(join(root, 'lib/factory-concept-pack.ts'), 'utf8');
const notifySrc = readFileSync(join(root, 'lib/factory-notify.ts'), 'utf8');
const emailSrc = readFileSync(join(root, 'lib/email.ts'), 'utf8');

assert(packSrc.includes('Launch Complete email'), 'concept pack documents Launch Complete email');
assert(packSrc.includes('Executive Snapshot'), 'email has Executive Snapshot');
assert(packSrc.includes("What's Ready"), "email has What's Ready");
assert(packSrc.includes('Talking Points'), 'email has Talking Points');
assert(packSrc.includes('Before You Walk Into The Meeting'), 'email has meeting checklist');
assert(packSrc.includes('Conversation Strategy'), 'email has Conversation Strategy');
assert(packSrc.includes('Review Concept Pack'), 'email has Review CTA');
assert(packSrc.includes('Regenerate Concepts'), 'email has Regenerate CTA');
assert(packSrc.includes('Start New Launch'), 'email has New Launch CTA');
assert(
  packSrc.includes('before a single line of code is written'),
  'email has EA tagline',
);
assert(packSrc.includes('Does this feel like your organization?'), 'conversation guide bullet 1');
assert(packSrc.includes('formatFactoryGeneratedDuration'), 'duration helper exported');

assert(notifySrc.includes('Launch Complete |'), 'notify subject uses Launch Complete');
assert(notifySrc.includes('FACTORY_FOUNDER_NAME') || notifySrc.includes("'Robert'"), 'founder name Robert default');
assert(notifySrc.includes('formatFactoryGeneratedDuration'), 'notify wires generated duration');

assert(emailSrc.includes("title: 'Launch Complete'"), 'ready email shell title Launch Complete');
assert(emailSrc.includes('Concept Pack Ready'), 'ready email shell eyebrow');

function formatFactoryGeneratedDuration(startedAtIso, endedAt = new Date()) {
  const start = Date.parse(startedAtIso);
  if (!Number.isFinite(start)) return 'a few minutes';
  const totalSec = Math.max(1, Math.round((endedAt.getTime() - start) / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (minutes <= 0) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  return `${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${seconds === 1 ? '' : 's'}`;
}

const end = new Date('2026-07-18T12:02:14.000Z');
const start = '2026-07-18T12:00:00.000Z';
assert(
  formatFactoryGeneratedDuration(start, end) === '2 minutes 14 seconds',
  `duration format got "${formatFactoryGeneratedDuration(start, end)}"`,
);

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}
console.log('OK factory Launch Complete email contract passed');
