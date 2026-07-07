/**
 * Self-healing production start — ensures build exists before next start.
 * Forwards CLI args to `next start` (e.g. --hostname 127.0.0.1 --port 3102).
 */
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = process.cwd();

const ensure = spawnSync('node', [path.join('scripts', 'ensure-production-build.mjs')], {
  cwd: ROOT,
  stdio: 'inherit',
});

if (ensure.status !== 0) {
  process.exit(ensure.status ?? 1);
}

const forwarded = process.argv.slice(2).filter((arg) => arg !== '--');
const nextArgs = ['next', 'start', ...forwarded];
const child = spawn('npx', nextArgs, {
  cwd: ROOT,
  shell: true,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});

child.on('error', (err) => {
  console.error('[start-production] Failed to launch next start:', err.message);
  process.exit(1);
});
