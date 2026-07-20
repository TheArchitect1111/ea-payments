#!/usr/bin/env node
/**
 * Wrapper: runs TypeScript five-org Layout Composer verification via tsx.
 * Run: node scripts/test-layout-composer-five-orgs.mjs
 */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const res = spawnSync(npx, ['--yes', 'tsx', 'scripts/test-layout-composer-five-orgs.ts'], {
  cwd: root,
  encoding: 'utf8',
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

process.exit(res.status ?? 1);
