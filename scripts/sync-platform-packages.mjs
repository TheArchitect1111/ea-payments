#!/usr/bin/env node
/**
 * Verify local file: links to ea-operating-system platform packages.
 * (No copy step — Next resolves via package.json file: deps.)
 */
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const osPackages = resolve(root, '../../ea-operating-system/packages');

const required = [
  join(osPackages, 'capability-registry/package.json'),
  join(osPackages, 'capability-registry/src/index.ts'),
  join(osPackages, 'module-engine/package.json'),
  join(osPackages, 'module-engine/src/index.ts'),
  join(osPackages, 'theme-engine/package.json'),
  join(osPackages, 'theme-engine/src/index.ts'),
  join(osPackages, 'personality-engine/package.json'),
  join(osPackages, 'personality-engine/src/index.ts'),
  join(osPackages, 'website-engine/package.json'),
  join(osPackages, 'website-engine/src/index.ts'),
  join(osPackages, 'workspace-engine/package.json'),
  join(osPackages, 'workspace-engine/src/index.ts'),
  join(osPackages, 'payments-contract/package.json'),
  join(osPackages, 'payments-contract/src/index.ts'),
];

let ok = true;
for (const path of required) {
  if (!existsSync(path)) {
    console.error('Missing:', path);
    ok = false;
  } else {
    console.log('OK', path);
  }
}

if (!ok) {
  console.error('\nRun from a machine that has ea-operating-system checked out as a sibling of ea-launch-audit.');
  process.exit(1);
}

console.log('\nPlatform packages linked via file: deps — ready.');
