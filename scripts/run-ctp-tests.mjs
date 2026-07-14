/**
 * Run CTP acquisition-spine wiring scripts.
 *
 *   node scripts/run-ctp-tests.mjs           # all test-ctp-*.mjs
 *   node scripts/run-ctp-tests.mjs --spine   # curated deploy subset
 */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const scriptsDir = join(root, 'scripts');

const SPINE = [
  'test-ctp-client-type.mjs',
  'test-ctp-digital-presence.mjs',
  'test-ctp-portal-host.mjs',
  'test-ctp-executive-email.mjs',
  'test-ctp-approve-reveal.mjs',
  'test-ctp-mission-control-attention.mjs',
  'test-ctp-keynote-reveal.mjs',
  'test-ctp-portal-overview.mjs',
  'test-ctp-portal-progress.mjs',
];

const spineOnly = process.argv.includes('--spine');
const files = spineOnly
  ? SPINE
  : readdirSync(scriptsDir)
      .filter((name) => name.startsWith('test-ctp-') && name.endsWith('.mjs'))
      .sort();

if (!files.length) {
  console.error('No CTP test scripts found.');
  process.exit(1);
}

console.log(`CTP tests (${spineOnly ? 'spine' : 'full'}): ${files.length} script(s)`);

let failed = 0;
for (const file of files) {
  const path = join(scriptsDir, file);
  process.stdout.write(`→ ${file} … `);
  const result = spawnSync(process.execPath, [path], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status === 0) {
    console.log('PASS');
  } else {
    failed += 1;
    console.log('FAIL');
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
}

if (failed) {
  console.error(`\nCTP tests FAILED: ${failed}/${files.length}`);
  process.exit(1);
}

console.log(`\nCTP tests: PASS (${files.length})`);
process.exit(0);
