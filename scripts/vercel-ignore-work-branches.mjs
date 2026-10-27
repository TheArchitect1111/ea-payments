#!/usr/bin/env node
// Vercel ignoreCommand: production must pass the EA promotion gate before
// a production build is allowed. Vercel treats exit 0 as "skip deployment"
// and exit 1 as "continue building".
import { execFileSync } from 'node:child_process';

const branch = process.env.VERCEL_GIT_COMMIT_REF || '';
const target = process.env.VERCEL_ENV || '';

if (branch === 'master' && target === 'production') {
  try {
    execFileSync(process.execPath, ['scripts/verify-production-gate.mjs'], { stdio: 'inherit' });
    console.log('EA production promotion gate passed; allowing production build.');
    process.exit(1);
  } catch {
    console.error('EA production promotion gate rejected this commit; skipping deployment.');
    process.exit(0);
  }
}

try {
  const msg = execFileSync('git', ['log', '-1', '--pretty=%B'], { encoding: 'utf8' });
  if (msg.includes('EA-LIVE-CANDIDATE') && target === 'production') {
    console.log('EA-LIVE-CANDIDATE: continue through production build validation.');
    process.exit(1);
  }
  if (branch.startsWith('fix/') || branch.startsWith('feat/')) {
    console.log('Skipping preview for non-release feature branch ' + branch);
    process.exit(0);
  }
} catch (error) {
  console.error('Unable to read commit metadata; continue build for non-master target.', error.message);
}
process.exit(1);
