#!/usr/bin/env node
// Vercel ignoreCommand: exit 0 skips a deployment; exit 1 allows the build.
import { execSync } from 'child_process';

const branch = process.env.VERCEL_GIT_COMMIT_REF || '';
const target = process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV || '';
const isProduction = target === 'production' || process.env.VERCEL_ENV === 'production';

if (branch === 'master' && target === 'production') {
  console.log('Master production deployment requires the EA promotion gate.');
}

if (isProduction) {
  try {
    execSync('node scripts/verify-production-gate.mjs', { stdio: 'inherit' });
  } catch (error) {
    console.error('[EA Production Gate] Blocking production build because verification failed.');
    process.exit(0);
  }
}

if (branch.startsWith('fix/') || branch.startsWith('feat/')) {
  console.log(`Skipping preview for work branch ${branch} — report as SKIPPED not SUCCESS`);
  process.exit(0);
}

process.exit(1); // Build everything else
