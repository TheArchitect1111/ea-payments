#!/usr/bin/env node
/**
 * Sync @ea platform packages from ea-operating-system into vendor/
 * (same pattern as portal/premium chassis — CI/Vercel resolve file:./vendor/*).
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

/** Prefer sibling of ea-launch-audit, then sibling of ea-payments (legacy). */
const osCandidates = [
  resolve(root, '../../ea-operating-system/packages'),
  resolve(root, '../ea-operating-system/packages'),
];

const osPackages = osCandidates.find((p) => existsSync(p));
if (!osPackages) {
  console.error('ea-operating-system/packages not found. Tried:\n', osCandidates.join('\n'));
  process.exit(1);
}

const PACKAGES = [
  'capability-registry',
  'module-engine',
  'theme-engine',
  'personality-engine',
  'website-engine',
  'workspace-engine',
  'payments-contract',
];

for (const name of PACKAGES) {
  const source = join(osPackages, name);
  const target = join(root, 'vendor', name);
  if (!existsSync(join(source, 'package.json')) || !existsSync(join(source, 'src'))) {
    console.error('Missing package source:', source);
    process.exit(1);
  }
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(join(source, 'src'), join(target, 'src'), { recursive: true });
  if (existsSync(join(source, 'README.md'))) {
    cpSync(join(source, 'README.md'), join(target, 'README.md'));
  }
  const pkg = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
  // Keep relative file: deps among vendored siblings (../capability-registry etc.)
  writeFileSync(join(target, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
  console.log('Synced @ea/' + name, '→', target);
}

console.log('\nPlatform packages vendored. package.json should use file:./vendor/<name>.');
