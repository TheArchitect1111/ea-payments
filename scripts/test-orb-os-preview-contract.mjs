#!/usr/bin/env node
/**
 * Contract: Orb OS Preview (feature-flagged conversational shell).
 * Run: node scripts/test-orb-os-preview-contract.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const files = [
  'lib/orb-os/preview.ts',
  'lib/orb-os/intent.ts',
  'lib/orb-os/index.ts',
  'app/simplifi/orb/page.tsx',
  'app/simplifi/orb/OrbOsShell.tsx',
  'app/api/simplifi/orb-preview/route.ts',
  'docs/ORB-OS-PREVIEW.md',
];

for (const rel of files) {
  assert(existsSync(join(root, rel)), `missing ${rel}`);
}

const intent = readFileSync(join(root, 'lib/orb-os/intent.ts'), 'utf8');
assert(intent.includes('interpretOrbIntent'), 'intent router required');
assert(intent.includes('buildAmbientOpening'), 'ambient opening required');
assert(intent.includes("'capture'"), 'capture intent required');
assert(intent.includes("'brief'"), 'brief intent required');

const preview = readFileSync(join(root, 'lib/orb-os/preview.ts'), 'utf8');
assert(preview.includes('ORB_OS_PREVIEW_COOKIE'), 'preview cookie required');
assert(preview.includes('NEXT_PUBLIC_ORB_OS_PREVIEW'), 'env flag required');

const shell = readFileSync(join(root, 'app/simplifi/orb/OrbOsShell.tsx'), 'utf8');
assert(shell.includes('How can I help today?'), 'Orb prompt required');
assert(shell.includes('Classic Simplifi'), 'classic escape required');
assert(shell.includes('answerConversationalAsk'), 'must reuse ask engine');

const workspace = readFileSync(join(root, 'app/simplifi/workspace/page.tsx'), 'utf8');
assert(workspace.includes('isOrbOsPreviewEnabled'), 'workspace must respect Orb flag');
assert(workspace.includes('classic'), 'classic override required');

const doc = readFileSync(join(root, 'docs/ORB-OS-PREVIEW.md'), 'utf8');
assert(doc.includes('Do not rebuild') || doc.includes('do not rebuild'), 'evolution doctrine required');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS orb-os-preview-contract');
