#!/usr/bin/env node
/**
 * Sync landing-chassis from ea-operating-system into ea-payments (reference copy).
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const source = resolve(root, '../../ea-operating-system/landing-chassis');
const target = resolve(root, 'lib/landing-chassis');

if (!existsSync(source)) {
  console.error('Landing chassis source not found:', source);
  process.exit(1);
}

if (existsSync(target)) rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

for (const item of ['index.ts', 'LandingPage.tsx', 'landing.css', 'types.ts', 'config.ts', 'README.md']) {
  const src = join(source, item);
  if (existsSync(src)) cpSync(src, join(target, item));
}

console.log('Synced landing-chassis to', target);
