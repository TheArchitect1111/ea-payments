import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = readFileSync('lib/business-presence.ts', 'utf8');
const panel = readFileSync('app/portal/[slug]/settings/BusinessPresencePanel.tsx', 'utf8');
const settings = readFileSync('app/portal/[slug]/settings/page.tsx', 'utf8');
const ecosystem = readFileSync('ECOSYSTEM-MAP.md', 'utf8');

assert.match(manifest, /id: 'apple-business'/);
assert.match(manifest, /status: 'guided-setup'/);
assert.match(manifest, /automated synchronization remains disabled/i);
assert.match(manifest, /SharedBusinessProfile/);
assert.match(panel, /Set up Apple Business/);
assert.match(panel, /EVA readiness/);
assert.match(settings, /<BusinessPresencePanel \/>/);
assert.match(ecosystem, /Apple Business/);

console.log('Apple Business presence contract: PASS');
