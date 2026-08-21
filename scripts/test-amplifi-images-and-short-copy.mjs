import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('app/amplifi/AmplifiPostApp.tsx', 'utf8');
const campaign = readFileSync('app/api/portal/amplifi/create-campaign/route.ts', 'utf8');
const research = readFileSync('lib/amplifi/topic-research.ts', 'utf8');

assert.doesNotMatch(campaign, /const imageOrigin/, 'Campaign images must not use a deployment-specific origin');
assert.doesNotMatch(research, /const imageOrigin/, 'Research images must not use a deployment-specific origin');
assert.match(campaign, /imageUrl: `\/api\/amplifi\/post-image/, 'Campaign images must use same-site URLs');
assert.match(research, /imageUrl: `\/api\/amplifi\/post-image/, 'Research images must use same-site URLs');
assert.match(app, /safePostImageUrl/, 'Saved campaigns must repair old absolute image URLs');
assert.match(campaign, /shortenGeneratedText\(post\.caption, 320\)/, 'Campaign captions must have a hard maximum');
assert.match(research, /shortenGeneratedText\(post\.linkedIn, 320\)/, 'Research posts must have a hard maximum');
assert.match(campaign, /between 35 and 55 words/, 'Campaign prompt must request short posts');
assert.match(research, /between 35 and 55 words/, 'Research prompt must request short posts');

console.log('Amplifi uses same-site images and concise post copy.');
