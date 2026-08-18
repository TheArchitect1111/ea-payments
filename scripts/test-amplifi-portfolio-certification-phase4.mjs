/** Amplifi portfolio attribution and durability — Phase 4 certification contract. */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const types = read('lib/creative-studio/types.ts');
const analytics = read('lib/creative-studio/campaign-analytics.ts');
const redirect = read('app/r/amplifi/[campaignId]/[assetId]/route.ts');
const persistence = read('lib/amplifi-portfolio-persistence.ts');
const create = read('app/api/portal/amplifi/create-campaign/route.ts');
const schedule = read('app/api/portal/amplifi/campaigns/[id]/schedule/route.ts');
const results = read('app/api/portal/amplifi/campaigns/[id]/analytics/route.ts');
const app = read('app/amplifi/AmplifiPostApp.tsx');
const command = read('app/amplifi/PortfolioCampaignCommandCenter.tsx');

assert.match(types, /interface CampaignProductMetrics/, 'product metrics are modeled');
assert.match(types, /byProduct: CampaignProductMetrics\[\]/, 'campaign analytics includes products');
assert.match(analytics, /productMetrics = asset\.productId/, 'events roll up to the assigned product');
assert.match(redirect, /amplifi_product/, 'tracked links carry product attribution');
assert.match(redirect, /amplifi_wave/, 'tracked links carry launch-wave attribution');
assert.match(persistence, /saveCampaignDurably/, 'portfolio campaigns require durable persistence');
assert.match(persistence, /portalSlug: input\.portalSlug/, 'durable campaigns remain tenant-scoped');
assert.match(create, /finalizeCampaign/, 'generated portfolio campaigns cross the persistence boundary');
assert.ok(existsSync('app/api/portal/amplifi/campaigns/[id]/schedule/route.ts'), 'server schedule route exists');
assert.match(schedule, /campaign\.portalSlug !== tenant\.portalSlug/, 'schedule route enforces tenant ownership');
assert.match(schedule, /findPortfolioScheduleConflicts/, 'server independently checks schedule conflicts');
assert.match(schedule, /Every publishing time must be in the future/, 'server rejects stale schedule times');
assert.match(schedule, /durable image or video to every Instagram post/, 'Instagram cannot schedule ephemeral preview media');
assert.match(schedule, /The schedule could not be saved durably/, 'UI cannot receive false durable success');
assert.match(results, /analytics\.byProduct/, 'portal analytics returns product-level results');
assert.match(app, /saveCampaignSchedule = async/, 'schedule control calls the server');
assert.match(app, /durable server storage is not configured/, 'UI exposes durability failure');
assert.match(command, /productResults/, 'Command Center renders product results');

console.log('Amplifi portfolio Phase 4 certification contract: PASS');
