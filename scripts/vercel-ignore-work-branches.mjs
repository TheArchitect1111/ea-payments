#!/usr/bin/env node
// Vercel ignoreCommand — fail-closed but report correctly
import { execSync } from 'child_process';
try{
  const branch = process.env.VERCEL_GIT_COMMIT_REF || '';
  const msg = execSync('git log -1 --pretty=%B').toString();
  // If gate failed, skip deploy but report as skipped not success
  if(msg.includes('EA-LIVE-CANDIDATE') && process.env.VERCEL_ENV==='production'){
    console.log('EA-LIVE-CANDIDATE — checking gate...');
    // Let build proceed to gate check
    process.exit(1); // 1 = don't ignore, build it
  }
  if(branch.startsWith('fix/') || branch.startsWith('feat/')) {
    console.log(`Skipping preview for work branch ${branch} — report as SKIPPED not SUCCESS`);
    process.exit(0);
  }
  process.exit(1); // Build everything else
}catch(e){
  console.log('Ignore check failed, building to be safe:', e.message);
  process.exit(1);
}
