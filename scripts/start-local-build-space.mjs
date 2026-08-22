import { spawn } from 'node:child_process';
import { execSync } from 'node:child_process';
import { getBuildLane, BUILD_LANES } from '../lib/factory-build-space.mjs';

let branch = process.env.EA_BUILD_BRANCH || '';
if (!branch) {
  try {
    branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch {
    branch = '';
  }
}

if (getBuildLane(branch) !== BUILD_LANES.WORK) {
  console.error(`[EA Build Space] Local design work must run from work/* branch. Current: ${branch || '(unknown)'}`);
  process.exit(1);
}

const port = process.env.PORT || '3000';
console.log(`[EA Build Space] Local-only preview on branch ${branch}`);
console.log(`[EA Build Space] Vercel is not part of this lane. Open http://localhost:${port}`);

const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['next', 'dev', '--hostname', '0.0.0.0', '--port', port], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));
