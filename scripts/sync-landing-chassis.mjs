#!/usr/bin/env node
/**
 * Sync landing-chassis from ea-operating-system into ea-payments (reference copy).
 */
import { cpSync, existsSync, mkdirSync, rmSync, renameSync } from 'node:fs';
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

const files = [
  'index.ts',
  'LandingPage.tsx',
  'icons.tsx',
  'types.ts',
  'README.md',
  'landing-chassis.css',
  'landing.css',
  'config.ts',
];

for (const item of files) {
  const src = join(source, item);
  if (existsSync(src)) cpSync(src, join(target, item));
}

const cssSrc = join(target, 'landing-chassis.css');
const cssDest = join(target, 'landing.css');
if (existsSync(cssSrc) && !existsSync(cssDest)) {
  renameSync(cssSrc, cssDest);
}

console.log('Synced landing-chassis to', target);
