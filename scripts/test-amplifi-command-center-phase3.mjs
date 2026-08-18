/** Amplifi Campaign Command Center — Phase 3 contract. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('app/amplifi/AmplifiPostApp.tsx', 'utf8');
const command = readFileSync('app/amplifi/PortfolioCampaignCommandCenter.tsx', 'utf8');
const orchestration = readFileSync('lib/amplifi-campaign-command.ts', 'utf8');
const route = readFileSync('app/api/portal/amplifi/create-campaign/route.ts', 'utf8');
const landing = readFileSync('app/amplifi/page.tsx', 'utf8');

assert.match(app, /architecture\?\.mode === 'portfolio'/, 'Command Center appears only for portfolio campaigns');
assert.match(command, /Current launch wave/, 'minimal view shows the current wave');
assert.match(command, /Next action/, 'minimal view shows one next action');
assert.match(command, /Results/, 'minimal view shows results');
assert.match(command, /Manage campaign/, 'complexity stays behind one control');
assert.match(command, /Product tracks/, 'management view organizes product content');
assert.match(command, /Launch sequence/, 'management view shows launch waves');
assert.match(command, /Master calendar/, 'management view combines the schedule');
assert.match(orchestration, /assignPortfolioPosts/, 'posts receive product and wave assignments');
assert.match(orchestration, /findPortfolioScheduleConflicts/, 'schedule conflict detection exists');
assert.match(app, /portfolioScheduleConflicts\.length > 0/, 'conflicts block schedule saving');
assert.match(app, /assignedProduct\.callToAction\.label/, 'post regeneration preserves the product CTA');
assert.match(route, /Wave \$\{index \+ 1\}/, 'portfolio products receive sequenced waves');
assert.doesNotMatch(landing, /Campaign Command Center|Product tracks|Launch sequence/, 'landing page remains uncluttered');

console.log('Amplifi Campaign Command Center Phase 3: PASS');
