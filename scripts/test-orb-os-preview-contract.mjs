#!/usr/bin/env node
/**
 * Contract: Orb OS Preview legacy chat shell (escape hatch only).
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

const shell = readFileSync(join(root, 'app/simplifi/orb/OrbOsShell.tsx'), 'utf8');
assert(shell.includes('How can I help today?'), 'chat shell prompt retained for ?chat=1');
assert(shell.includes('answerConversationalAsk'), 'must reuse ask engine');

const orbPage = readFileSync(join(root, 'app/simplifi/orb/page.tsx'), 'utf8');
assert(orbPage.includes("redirect('/simplifi/workspace')"), 'default redirect to Brief');
assert(orbPage.includes('chat'), 'chat escape hatch required');

const workspace = readFileSync(join(root, 'app/simplifi/workspace/page.tsx'), 'utf8');
assert(workspace.includes('SimplifiProductShell'), 'workspace uses product shell');

const doc = readFileSync(join(root, 'docs/ORB-OS-PREVIEW.md'), 'utf8');
assert(doc.includes('chat=1') || doc.includes('legacy'), 'docs note chat-first is legacy');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS orb-os-preview-contract');
