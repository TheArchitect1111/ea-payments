import { spawnSync } from 'node:child_process';

const branch = process.env.VERCEL_GIT_COMMIT_REF || '';
const target = process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV || '';

if (branch.startsWith('work/')) {
  console.log(`[EA Build Space] Ignoring Vercel deployment for local-only branch: ${branch}`);
  process.exit(0);
}

if (branch === 'ea-eva-authority-certification' && target === 'preview') {
  console.log('[EA AI Authority] Running isolated certification tests.');
  const certification = spawnSync('node', ['scripts/test-ai-action-authority.mjs'], {
    cwd: process.cwd(), shell: false, stdio: 'inherit', env: process.env,
  });
  if ((certification.status ?? 2) !== 0) {
    console.error('[EA AI Authority] Certification failed. Preview blocked.');
    process.exit(0);
  }
  console.log('[EA AI Authority] Certification PASS.');
}

// Preview deployments remain available for QA. Production on master is different:
// it must be a pure promotion commit containing only the signed gate manifest.
if (branch === 'master' && target === 'production') {
  const result = spawnSync('node', ['scripts/verify-production-gate.mjs'], {
    cwd: process.cwd(), shell: false, stdio: 'inherit', env: process.env,
  });
  if ((result.status ?? 2) !== 0) {
    console.log('[EA Build Space] Production deployment blocked by mandatory gate.');
    process.exit(0);
  }
}

console.log(`[EA Build Space] Vercel deployment allowed for branch: ${branch || '(unknown)'} target: ${target || '(unknown)'}`);
process.exit(1);
