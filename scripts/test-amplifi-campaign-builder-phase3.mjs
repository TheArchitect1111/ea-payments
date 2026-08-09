/**
 * Amplifi Phase 3 campaign builder contract.
 * Run: node scripts/test-amplifi-campaign-builder-phase3.mjs
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
const store = read('lib/creative-studio/campaign-store.ts');
const generator = read('lib/creative-studio/generate-assets.ts');
const route = read('app/api/creative-studio/campaigns/route.ts');
const builder = read('app/admin/creative-studio/CreativeStudioClient.tsx');
const dashboard = read('app/admin/creative-studio/campaigns/[id]/CampaignDashboardClient.tsx');

for (const field of ['objective', 'audience', 'platforms', 'tone', 'successMetric', 'contentPillars']) {
  assert(types.includes(`${field}:`), `strategy models ${field}`);
}
assert(store.includes('normalizeStrategy'), 'campaign strategy is normalized server-side');
assert(store.includes("['facebook', 'instagram']"), 'Facebook and Instagram are safe defaults');
assert(route.includes('Select at least one social platform.'), 'API rejects empty platform selection');
assert(route.includes('Campaign end date must be on or after its start date.'), 'API validates campaign dates');

assert(generator.includes("type === 'social-instagram'"), 'Instagram receives distinct copy');
assert(generator.includes("type === 'social-facebook'"), 'Facebook receives distinct copy');
assert(generator.includes('input.strategy.platforms.includes'), 'only selected social platforms are generated');
assert(generator.includes("type === 'social-x' ? 280"), 'X copy retains its platform limit');

assert(builder.includes('Campaign brief'), 'guided campaign brief is present');
assert(builder.includes('Content pillars'), 'builder captures content pillars');
assert(builder.includes('Success metric'), 'builder captures measurement plan');
assert(builder.includes('PLATFORM_LABELS'), 'builder provides platform selection');
assert(dashboard.includes('campaign.strategy.contentPillars'), 'dashboard displays campaign strategy');

process.exit(failed ? 1 : 0);
