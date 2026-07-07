/**
 * EA Codex deployment guard — production server must not start without a bundle.
 *
 * Rules:
 * 1. Missing or incomplete .next → run build
 * 2. Root config/deps newer than BUILD_ID → run build
 * 3. EA_FORCE_BUILD=1 → run build
 *
 * Usage: node scripts/ensure-production-build.mjs
 */
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BUILD_ID_PATH = path.join(ROOT, '.next', 'BUILD_ID');
const SERVER_DIR = path.join(ROOT, '.next', 'server');

const WATCH_FILES = [
  'package.json',
  'package-lock.json',
  'next.config.ts',
  'tsconfig.json',
];

function buildReason() {
  if (process.env.EA_FORCE_BUILD === '1') {
    return 'EA_FORCE_BUILD=1';
  }
  if (!existsSync(BUILD_ID_PATH)) {
    return 'missing .next/BUILD_ID';
  }
  if (!existsSync(SERVER_DIR)) {
    return 'incomplete production bundle (.next/server missing)';
  }

  const buildMtime = statSync(BUILD_ID_PATH).mtimeMs;
  for (const rel of WATCH_FILES) {
    const filePath = path.join(ROOT, rel);
    if (!existsSync(filePath)) continue;
    if (statSync(filePath).mtimeMs > buildMtime) {
      return `${rel} changed since last build`;
    }
  }

  return null;
}

const reason = buildReason();
if (!reason) {
  console.log('[ensure-production-build] Production bundle present — skipping build.');
  process.exit(0);
}

console.log(`[ensure-production-build] Running build (${reason})…`);
const result = spawnSync('npm run build', {
  cwd: ROOT,
  shell: true,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
