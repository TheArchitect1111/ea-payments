#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const syncScript = resolve(here, 'sync-platform-packages.mjs');
const packages = [
  'capability-registry',
  'module-engine',
  'theme-engine',
  'personality-engine',
  'website-engine',
  'workspace-engine',
  'payments-contract',
];

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options });
}

function hashTree(dir) {
  const hash = createHash('sha256');
  function walk(current) {
    for (const name of readdirSync(current).sort()) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) walk(full);
      else {
        hash.update(relative(dir, full).split('\\').join('/'));
        hash.update('\0');
        hash.update(readFileSync(full));
        hash.update('\0');
      }
    }
  }
  walk(dir);
  return hash.digest('hex');
}

const fixture = mkdtempSync(join(tmpdir(), 'platform-sync-test-'));
const consumerRoot = join(fixture, 'ea-payments');
const sourceRoot = join(fixture, 'ea-operating-system');
const sourcePackages = join(sourceRoot, 'packages');
const vendorRoot = join(consumerRoot, 'vendor');
const sourceCommit = () =>
  execFileSync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

try {
  mkdirSync(join(consumerRoot, 'scripts'), { recursive: true });
  mkdirSync(sourcePackages, { recursive: true });
  writeFileSync(join(consumerRoot, 'scripts/sync-platform-packages.mjs'), readFileSync(syncScript));
  for (const name of packages) {
    const source = join(sourcePackages, name);
    mkdirSync(join(source, 'src'), { recursive: true });
    writeFileSync(
      join(source, 'package.json'),
      JSON.stringify({ name: '@ea/' + name, version: '1.2.3' }, null, 2) + '\n',
    );
    writeFileSync(join(source, 'src/index.ts'), "export { value } from './value.js';\n");
    writeFileSync(join(source, 'src/value.ts'), 'export const value = 1;\n');
  }

  execFileSync('git', ['init', '-q', sourceRoot]);
  execFileSync('git', ['-C', sourceRoot, 'config', 'user.email', 'sync-test@example.invalid']);
  execFileSync('git', ['-C', sourceRoot, 'config', 'user.name', 'Sync test']);
  execFileSync('git', ['-C', sourceRoot, 'add', '.']);
  execFileSync('git', ['-C', sourceRoot, 'commit', '-qm', 'fixture source']);

  const syncPath = join(consumerRoot, 'scripts/sync-platform-packages.mjs');
  const firstRun = run(process.execPath, [syncPath]);
  assert.equal(firstRun.status, 0, firstRun.stderr || firstRun.stdout);
  const metaPath = join(vendorRoot, '.platform-sync-meta.json');
  const metadata = JSON.parse(readFileSync(metaPath, 'utf8'));
  assert.equal(metadata.schemaVersion, 1);
  assert.equal(metadata.source.repository, 'TheArchitect1111/ea-operating-system');
  assert.equal(metadata.source.commit, sourceCommit());
  assert.equal(metadata.source.dirty, false);
  assert.deepEqual(metadata.packages, packages);
  for (const name of packages) {
    const vendorPackage = join(vendorRoot, name);
    assert.equal(metadata.packageHashes[name], hashTree(vendorPackage));
    assert.equal(
      readFileSync(join(vendorPackage, 'src/index.ts'), 'utf8'),
      "export { value } from './value';\n",
    );
  }

  // Dirty source must be rejected before the previous vendor snapshot changes.
  const stableVendor = readFileSync(join(vendorRoot, 'capability-registry/src/value.ts'), 'utf8');
  writeFileSync(
    join(sourcePackages, 'capability-registry/src/value.ts'),
    'export const value = 2;\n',
  );
  const dirtyRun = run(process.execPath, [syncPath]);
  assert.notEqual(dirtyRun.status, 0);
  assert.equal(
    readFileSync(join(vendorRoot, 'capability-registry/src/value.ts'), 'utf8'),
    stableVendor,
  );
  assert.equal(JSON.parse(readFileSync(metaPath, 'utf8')).source.commit, metadata.source.commit);

  // Once intentional source changes are committed, a missing package still leaves vendor intact.
  execFileSync('git', ['-C', sourceRoot, 'add', '.']);
  execFileSync('git', ['-C', sourceRoot, 'commit', '-qm', 'change source']);
  execFileSync('git', ['-C', sourceRoot, 'rm', '-rq', 'packages/workspace-engine']);
  execFileSync('git', ['-C', sourceRoot, 'commit', '-qm', 'remove package fixture']);
  const beforeMissingPackageRun = readFileSync(
    join(vendorRoot, 'capability-registry/src/value.ts'),
    'utf8',
  );
  const missingRun = run(process.execPath, [syncPath]);
  assert.notEqual(missingRun.status, 0);
  assert.equal(
    readFileSync(join(vendorRoot, 'capability-registry/src/value.ts'), 'utf8'),
    beforeMissingPackageRun,
  );
  assert.equal(JSON.parse(readFileSync(metaPath, 'utf8')).source.commit, metadata.source.commit);

  console.log('Platform package sync provenance and rollback checks passed.');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
