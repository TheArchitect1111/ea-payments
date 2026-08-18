/** Amplifi multi-product campaign architecture — Step 1 contract. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const types = readFileSync('lib/creative-studio/types.ts', 'utf8');
const architecture = readFileSync('lib/creative-studio/campaign-architecture.ts', 'utf8');
const store = readFileSync('lib/creative-studio/campaign-store.ts', 'utf8');
const route = readFileSync('app/api/creative-studio/campaigns/route.ts', 'utf8');
const landing = readFileSync('app/amplifi/AmplifiHome.tsx', 'utf8');

for (const contract of [
  'CampaignArchitecture',
  'CampaignAudienceSegment',
  'CampaignProductTrack',
  'CampaignLaunchWave',
  'CampaignCallToAction',
]) {
  assert.match(types, new RegExp(`interface ${contract}`), `${contract} is modeled`);
}
assert.match(types, /mode: CampaignArchitectureMode/, 'single and portfolio modes are explicit');
assert.match(architecture, /normalizeCampaignArchitecture/, 'architecture input is normalized');
assert.match(architecture, /createSingleCampaignArchitecture/, 'standard campaigns remain supported');
assert.match(architecture, /allowedAudienceIds/, 'product audience references are constrained');
assert.match(architecture, /allowedProductIds/, 'wave product references are constrained');
assert.match(store, /architecture: normalizeCampaignArchitecture/, 'campaign creation persists architecture');
assert.match(store, /withCampaignArchitecture/, 'legacy campaigns receive a safe standard architecture');
assert.match(route, /architecture\?: Partial<CampaignArchitecture>/, 'campaign API accepts portfolio architecture');
assert.doesNotMatch(landing, /Campaign Command Center|portfolio campaign|multiple products/i, 'landing page remains uncluttered');

console.log('Amplifi campaign architecture Step 1: PASS');
