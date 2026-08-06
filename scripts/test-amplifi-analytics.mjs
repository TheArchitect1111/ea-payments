import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

const types = read('lib/creative-studio/types.ts');
const generator = read('lib/creative-studio/generate-assets.ts');
const analytics = read('lib/creative-studio/campaign-analytics.ts');
const redirect = read('app/r/amplifi/[campaignId]/[assetId]/route.ts');
const assessment = read('app/api/assessment/submit/route.ts');
const dashboard = read('app/admin/creative-studio/campaigns/[id]/CampaignDashboardClient.tsx');

assert.match(types, /interface CampaignAnalytics/);
assert.match(types, /ctpCompletions/);
assert.match(generator, /\/r\/amplifi\//);
assert.match(generator, /destinationUrl/);
assert.match(redirect, /utm_campaign/);
assert.match(redirect, /createAttributionCookie/);
assert.match(analytics, /timingSafeEqual/);
assert.match(analytics, /campaignPerformance/);
assert.match(assessment, /recordCampaignActivity/);
assert.match(assessment, /ctpComplete: true/);
assert.match(dashboard, /Campaign results/);
assert.match(dashboard, /Insights not connected/);
assert.match(dashboard, /Save platform totals/);

console.log('PASS Amplifi campaign analytics contract');
