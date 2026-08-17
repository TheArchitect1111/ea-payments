import assert from 'node:assert/strict';
import fs from 'node:fs';

const home = fs.readFileSync('app/amplifi/AmplifiHome.tsx', 'utf8');
const workspace = fs.readFileSync('app/amplifi/AmplifiPostApp.tsx', 'utf8');
const styles = fs.readFileSync('app/amplifi/amplifi-home.css', 'utf8');

for (const phrase of [
  'What would you like Amplifi to do?',
  'I’ll create it',
  'Create it for me',
  'Research and create it',
  'Start creating',
  'Tell Amplifi',
  'Start research',
  'Nothing publishes until you approve it.',
]) {
  assert.ok(home.includes(phrase), `Missing client-home contract: ${phrase}`);
}

for (const phrase of [
  'Good morning, Robert.',
  'Here’s what needs your attention.',
  'Review posts',
  'View calendar',
  'Performance appears after publishing.',
  'never placeholder numbers',
]) {
  assert.ok(home.includes(phrase), `Missing owner-home contract: ${phrase}`);
}

assert.ok(home.includes('/amplifi/amplifi-logo-premium.png'), 'Official Amplifi logo is missing from the home.');
assert.ok(workspace.includes("ownerMode={slug === 'ea'}"), 'EA owner routing is missing.');
assert.ok(workspace.includes('setShowHome(false)'), 'Path selection must reveal the focused workspace.');
assert.ok(workspace.includes('af-workspace-logo'), 'Official Amplifi logo is missing from the deep workspace.');
assert.ok(styles.includes('@media (max-width: 620px)'), 'Mobile home layout is missing.');
assert.equal(home.includes('Developer setup required'), false, 'Technical setup language leaked onto the simple home.');

console.log('Simplified Amplifi client and owner portal contracts: PASS');
