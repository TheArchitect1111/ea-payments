/**
 * Amplifi Phase 5 approval and scheduling contract.
 * Run: node scripts/test-amplifi-approval-scheduling-phase5.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function read(rel) {
  const path = join(root, rel);
  if (!existsSync(path)) throw new Error(`Missing ${rel}`);
  return readFileSync(path, 'utf8');
}
let failed = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failed += 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

const types = read('lib/creative-studio/types.ts');
const workflow = read('lib/creative-studio/campaign-workflow.ts');
const publisher = read('lib/creative-studio/publish-asset.ts');
const scheduler = read('lib/creative-studio/campaign-scheduler.ts');
const cron = read('app/api/cron/amplifi-publish/route.ts');
const dashboard = read('app/admin/creative-studio/campaigns/[id]/CampaignDashboardClient.tsx');
const vercel = read('vercel.json');

for (const status of ["'review'", "'approved'", "'scheduled'", "'publishing'", "'cancelled'"]) {
  assert(types.includes(status), `asset supports ${status}`);
}
assert(types.includes('requestedBy?: string'), 'review request evidence is stored');
assert(types.includes('decidedBy?: string'), 'approval evidence is stored');
assert(types.includes('publishAt: string'), 'schedule timestamp is stored');
assert(types.includes('timezone: string'), 'schedule timezone is stored');

assert(workflow.includes('Content must be in review before approval.'), 'approval requires review');
assert(workflow.includes('Attach valid campaign media before approval.'), 'approval requires valid social media');
assert(workflow.includes('Content must be approved before scheduling.'), 'scheduling requires approval');
assert(workflow.includes('Scheduled publishing time must be in the future.'), 'schedules must be future-dated');
assert(workflow.includes('Campaign publishing is paused.'), 'campaign pause blocks publishing');
assert(publisher.includes('canPublishAsset(campaign, asset)'), 'publisher enforces workflow gate');
assert(scheduler.includes("asset.status === 'scheduled'"), 'scheduler selects scheduled posts');
assert(scheduler.includes("asset.approval?.status === 'approved'"), 'scheduler requires approval');
assert(cron.includes('CRON_SECRET'), 'scheduler endpoint is protected');
assert(vercel.includes('/api/cron/amplifi-publish'), 'Vercel invokes scheduler');
assert(dashboard.includes('Submit for review'), 'dashboard starts review');
assert(dashboard.includes('Approve'), 'dashboard records approval');
assert(dashboard.includes('Cancel schedule'), 'dashboard cancels schedules');
assert(dashboard.includes('Pause campaign'), 'dashboard pauses campaigns');

process.exit(failed ? 1 : 0);
