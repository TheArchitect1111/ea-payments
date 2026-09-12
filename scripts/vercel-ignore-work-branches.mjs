import { spawnSync } from 'node:child_process';

const branch = process.env.VERCEL_GIT_COMMIT_REF || '';
const target = process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV || '';

if (branch.startsWith('work/')) {
  console.log(`[EA Build Space] Ignoring Vercel deployment for local-only branch: ${branch}`);
  process.exit(0);
}

// Temporary enterprise disaster-recovery certification branch.
// Run the live Airtable export + provider-neutral SQLite reconstruction before the
// ordinary preview build. The script prints proof only, never credentials or records.
if (branch === 'ea-airtable-live-recovery-proof') {
  console.log('[EA Recovery] Running live Airtable disaster-recovery certification preflight.');
  const recovery = spawnSync('node', ['scripts/live-airtable-recovery-proof.mjs'], {
    cwd: process.cwd(),
    shell: false,
    stdio: 'inherit',
    env: process.env,
  });
  if ((recovery.status ?? 2) !== 0) {
    console.log('[EA Recovery] Certification failed closed. Preview deployment skipped.');
    process.exit(0);
  }
  console.log('[EA Recovery] Certification preflight passed. Continuing isolated preview deployment.');
}

// Preview deployments remain available for QA. Production on master is different:
// it must be a pure promotion commit containing only the signed gate manifest.
if (branch === 'master' && target === 'production') {
  const result = spawnSync('node', ['scripts/verify-production-gate.mjs'], {
    cwd: process.cwd(),
    shell: false,
    stdio: 'inherit',
    env: process.env,
  });
  if ((result.status ?? 2) !== 0) {
    console.log('[EA Build Space] Production deployment blocked by mandatory gate.');
    process.exit(0); // Vercel ignoreCommand: 0 means skip deployment.
  }
}

console.log(`[EA Build Space] Vercel deployment allowed for branch: ${branch || '(unknown)'} target: ${target || '(unknown)'}`);
process.exit(1); // Vercel ignoreCommand: 1 means continue deployment.
