/** Amplifi adaptive campaign builder — Phase 2 contract. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('app/amplifi/AmplifiPostApp.tsx', 'utf8');
const route = readFileSync('app/api/portal/amplifi/create-campaign/route.ts', 'utf8');
const landing = readFileSync('app/amplifi/page.tsx', 'utf8');
const styles = readFileSync('app/amplifi/amplifi.css', 'utf8');

assert.match(app, /<legend>What are you promoting\?<\/legend>/, 'builder asks one promotion-scope question');
assert.match(app, /One product or service/, 'simple path remains the default choice');
assert.match(app, /Multiple products or services/, 'portfolio path is available');
assert.match(app, /promotionScope === 'portfolio'/, 'portfolio controls are progressive');
assert.match(app, /Give each product its own audience and next step/, 'portfolio captures product-specific direction');
assert.match(app, /portfolioProducts: promotionScope === 'portfolio'/, 'portfolio brief reaches the API');
assert.match(route, /normalizeCampaignArchitecture/, 'API maps the adaptive brief to core architecture');
assert.match(route, /Add at least two complete product briefs/, 'API rejects incomplete portfolio campaigns');
assert.match(route, /master-launch social posts/, 'portfolio generation is distinct from standard generation');
assert.match(styles, /af-promotion-scope/, 'adaptive selector is styled');
assert.doesNotMatch(landing, /Multiple products or services|Campaign Command Center/, 'marketing landing remains unchanged');

console.log('Amplifi adaptive campaign builder Phase 2: PASS');
