import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('app/amplifi/AmplifiPostApp.tsx', 'utf8');
const campaign = readFileSync('app/api/portal/amplifi/create-campaign/route.ts', 'utf8');
const research = readFileSync('lib/amplifi/topic-research.ts', 'utf8');

assert.match(app, /selectedPath === 'publish'/, 'Option 1 must remain the user-controlled post builder');
assert.match(app, /Amplifi turns them into an original campaign idea, hooks and five posts designed to attract, inform and sell/);

assert.match(campaign, /senior advertising creative director and conversion copywriter/);
assert.match(campaign, /Treat the brief below as raw strategy material, never as draft copy/);
assert.match(campaign, /Do not echo, lightly rewrite or use the client input as the headline/);
assert.match(campaign, /attract attention.*expose or educate around the pain.*build trust.*answer an objection.*sell the next step/s);
assert.doesNotMatch(campaign, /title: pain/);
assert.doesNotMatch(campaign, /caption: `\$\{toneLead\}\$\{pain\}/);

assert.match(research, /Treat the topic and sources as raw material, not copy to summarize or repeat/);
assert.match(research, /Do not echo the topic as the opening or merely list article titles/);
assert.doesNotMatch(research, /Post \$\{number\} of \$\{requestedPostCount\}/);
assert.match(app, /objective: campaignResult\.trim\(\)/, 'Option 3 must send its objective to the creative engine');
assert.match(app, /audience: campaignAudience\.trim\(\)/, 'Option 3 must send its audience to the creative engine');
assert.match(app, /post\.imageUrl.*af-generated-post-image/, 'Option 3 posts must display their image pair');

console.log('Amplifi Options 2 and 3 use the ad-agency creative standard; Option 1 remains user-controlled.');
