/**
 * Contract: standard Quick Launch journey must not depend on Factory navigation CTAs.
 * Run: node scripts/test-factory-quick-launch-one-page.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientPath = path.join(
  root,
  'app',
  'admin',
  'ea-factory',
  'quick-launch',
  'QuickLaunchClient.tsx',
);
const src = fs.readFileSync(clientPath, 'utf8');

assert.match(src, /Who should we build for\?/);
assert.match(src, /Research & Create/);
assert.match(src, /Add details only if you want to/);
assert.match(src, /Researching/);
assert.match(src, /Creating your samples/);
assert.match(src, /Ready to review/);
assert.match(src, /View research/);
assert.match(src, /Three visual concepts/);
assert.match(src, /View website/);
assert.match(src, /View portal/);
assert.match(src, /Select this direction/);
assert.match(src, /Approve and wire experience/);
assert.match(src, /Which one did you mean\?/);
assert.match(src, /projectId/);

assert.doesNotMatch(src, />\s*Open [Pp]roject\s*</);
assert.doesNotMatch(src, />\s*Open [Rr]eview\s*</);
assert.doesNotMatch(src, />\s*Generate real previews\s*</);
assert.doesNotMatch(src, /href=\{`\/admin\/ea-factory\/projects/);
assert.doesNotMatch(src, /href=\{`\/admin\/ea-factory\/concepts/);

console.log('test-factory-quick-launch-one-page.mjs: ok');
