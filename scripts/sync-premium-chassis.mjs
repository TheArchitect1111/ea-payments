#!/usr/bin/env node
/**
 * Sync @ea/premium-chassis from ea-operating-system into ea-payments/vendor.
 */
import { cpSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const source = resolve(root, '../../ea-operating-system/premium-chassis');
const target = resolve(root, 'vendor/premium-chassis');

if (!existsSync(source)) {
  console.error('Premium chassis source not found:', source);
  process.exit(1);
}

if (existsSync(target)) rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

for (const item of ['styles', 'presets', 'index.js', 'index.d.ts', 'theme.js', 'theme.d.ts', 'README.md']) {
  cpSync(join(source, item), join(target, item), { recursive: true });
}

const pkg = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
pkg.name = '@ea/premium-chassis';
writeFileSync(join(target, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);

console.log('Synced @ea/premium-chassis to', target);
