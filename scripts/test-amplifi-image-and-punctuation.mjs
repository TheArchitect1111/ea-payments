import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const imageRoute = readFileSync('app/api/amplifi/post-image/route.ts', 'utf8');
const campaignRoute = readFileSync('app/api/portal/amplifi/create-campaign/route.ts', 'utf8');
const research = readFileSync('lib/amplifi/topic-research.ts', 'utf8');
const app = readFileSync('app/amplifi/AmplifiPostApp.tsx', 'utf8');

assert.match(imageRoute, /image\/svg\+xml/, 'Image route must return a browser-displayable image');
assert.match(imageRoute, /status: 200/, 'Image route must return success');
assert.match(campaignRoute, /cleanGeneratedText/, 'Campaign output must sanitize punctuation');
assert.match(research, /cleanGeneratedText/, 'Research output must sanitize punctuation');
assert.match(campaignRoute, /Never use an em dash or en dash/, 'Campaign prompt must prohibit long dashes');
assert.match(research, /Never use an em dash or en dash/, 'Research prompt must prohibit long dashes');

for (const [name, source] of Object.entries({ campaignRoute, research, app })) {
  assert.equal(source.includes('\u2014'), false, `${name} still contains an em dash character`);
}

console.log('Amplifi image response and no-em-dash guardrails are present.');
