#!/usr/bin/env node
/**
 * CTP brand-feel color sync + review reminder wiring.
 * Run: node scripts/test-ctp-brand-feel-reminder.mjs
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

const brandPath = join(root, 'lib/ctp-brand-bridge.ts');
const schedulePath = join(root, 'lib/ctp-review-schedule.ts');
const emailPath = join(root, 'lib/email.ts');
const cronPath = join(root, 'app/api/cron/ctp-review-reminders/route.ts');
const vercelPath = join(root, 'vercel.json');
const submissionsPath = join(root, 'lib/ctp-submissions.ts');

for (const [p, label] of [
  [brandPath, 'ctp-brand-bridge'],
  [schedulePath, 'ctp-review-schedule'],
  [emailPath, 'email'],
  [cronPath, 'ctp-review-reminders cron'],
]) {
  assert(existsSync(p), `missing ${label}`);
}

const brand = readFileSync(brandPath, 'utf8');
assert(brand.includes('mapBrandFeelToColors'), 'must map brand_feel to colors');
assert(brand.includes('warm') && brand.includes('premium'), 'must cover discovery brand_feel IDs');
assert(brand.includes('primaryColor'), 'must set primaryColor');
assert(!brand.includes('if (!logoEntry?.url) return null;'), 'must not require logo for color sync');

const schedule = readFileSync(schedulePath, 'utf8');
assert(schedule.includes('sendCtpReviewReminderForSubmission'), 'reminder helper required');
assert(schedule.includes('processDueCtpReviewReminders'), 'cron processor required');
assert(schedule.includes('hoursAway > 24'), 'schedule-time reminder for >24h');

const email = readFileSync(emailPath, 'utf8');
assert(email.includes('sendCtpReviewReminderEmail'), 'Resend reminder helper required');

const cron = readFileSync(cronPath, 'utf8');
assert(cron.includes('processDueCtpReviewReminders'), 'cron must call processor');
assert(cron.includes('CRON_SECRET'), 'cron must use CRON_SECRET');

const vercel = readFileSync(vercelPath, 'utf8');
assert(vercel.includes('/api/cron/ctp-review-reminders'), 'vercel.json must register cron');

const submissions = readFileSync(submissionsPath, 'utf8');
assert(submissions.includes('reviewReminderSentAt'), 'submissions must persist reminder timestamp');

const pulse = readFileSync(join(root, 'lib/pulse-bus.ts'), 'utf8');
assert(pulse.includes('ctp.review.reminder_sent'), 'pulse must include reminder event');

if (failures.length) {
  console.error('CTP brand-feel + reminder checks FAILED:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('CTP brand-feel + reminder checks: PASS');
