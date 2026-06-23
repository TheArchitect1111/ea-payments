/**
 * Run all automatable launch verification checks.
 *
 * Usage:
 *   npm run launch:check
 *   LAUNCH_BASE_URL=https://www.efficiencyarchitects.online npm run launch:check
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = process.env.LAUNCH_BASE_URL || 'https://ea-payments.vercel.app';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd, args, label) {
  return new Promise((resolve) => {
    console.log(`\n▶ ${label}`);
    const child = spawn(cmd, args, {
      cwd: root,
      shell: true,
      env: { ...process.env, LAUNCH_BASE_URL: BASE },
      stdio: 'inherit',
    });
    child.on('close', (code) => resolve(code === 0));
  });
}

console.log('Launch check orchestrator —', BASE);

const steps = [
  ['node', ['scripts/launch-command-center.mjs', BASE], 'Command center report'],
  ['node', ['scripts/repo-readiness.mjs'], 'Repository readiness'],
  ['node', ['scripts/launch-readiness.mjs'], 'Route smoke + health'],
  ['node', ['scripts/test-tier2-launch.mjs', BASE], 'Tier 2 env'],
];

let failed = 0;
for (const [cmd, args, label] of steps) {
  const ok = await run(cmd, args, label);
  if (!ok) failed += 1;
}

// Local-only if .env.local exists
try {
  const fs = await import('node:fs');
  if (fs.existsSync(path.join(root, '.env.local'))) {
    const ok = await run('node', ['scripts/verify-airtable-schema.mjs'], 'Airtable schema (local env)');
    if (!ok) failed += 1;
  } else {
    console.log('\n○ Skipping verify-airtable (no .env.local — production check via command-center API)');
  }
} catch {
  // ignore
}

console.log('\n══════════════════════════════════════');
if (failed === 0) {
  console.log('Launch check: PASS (automated checks)');
  console.log('Manual: live Stripe checkout + Make scenario history');
  process.exit(0);
}
console.log(`Launch check: ${failed} step(s) failed`);
process.exit(1);
