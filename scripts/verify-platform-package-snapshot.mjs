#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const packages = [
  'capability-registry',
  'module-engine',
  'theme-engine',
  'personality-engine',
  'website-engine',
  'workspace-engine',
  'payments-contract',
];
const read = (path) => readFileSync(join(root, path), 'utf8');
const metadata = JSON.parse(read('vendor/.platform-sync-meta.json'));

assert.equal(metadata.schemaVersion, 1);
assert.equal(metadata.source.repository, 'TheArchitect1111/ea-operating-system');
assert.match(metadata.source.commit, /^[a-f0-9]{40}$/);
assert.equal(metadata.source.ref, 'main');
assert.equal(metadata.source.dirty, false);
assert.deepEqual(metadata.packages, packages);

function treeHash(dir) {
  const hash = createHash('sha256');
  const files = [];
  function walk(current) {
    for (const name of readdirSync(current).sort()) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) walk(full);
      else files.push(full);
    }
  }
  walk(dir);
  for (const file of files) {
    hash.update(relative(dir, file).split(sep).join('/'));
    hash.update('\0');
    hash.update(readFileSync(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}

for (const name of packages) {
  const dir = join(root, 'vendor', name);
  assert.ok(existsSync(dir), 'Missing vendored package: ' + name);
  assert.equal(
    treeHash(dir),
    metadata.packageHashes[name],
    'Vendor snapshot hash mismatch: ' + name,
  );
  function checkImports(current) {
    for (const child of readdirSync(current)) {
      const full = join(current, child);
      if (statSync(full).isDirectory()) checkImports(full);
      else if (/\.(ts|tsx)$/.test(full)) {
        const content = readFileSync(full, 'utf8');
        assert.doesNotMatch(
          content,
          /from\s+['"]\.\.?\/[^'"]+\.js['"]/,
          'Unrewritten relative .js import in ' + relative(root, full),
        );
      }
    }
  }
  checkImports(join(dir, 'src'));
}

assert.ok(existsSync(join(root, 'vendor/capability-registry/src/crm.ts')));
assert.match(read('vendor/module-engine/src/registry.ts'), /CRM_CAPABILITY_MANIFEST/);
assert.match(read('vendor/website-engine/src/types.ts'), /export type WebsiteEditMode/);
assert.match(read('vendor/website-engine/src/types.ts'), /export type WebsiteEditPolicy/);
assert.match(read('vendor/theme-engine/src/index.ts'), /logo: '\/EA_Logo\.png'/);
assert.match(read('vendor/theme-engine/src/index.ts'), /amandaEditorialTheme\.id/);
assert.match(read('vendor/theme-engine/src/index.ts'), /eaImmersiveTheme\.id/);

const paymentRoot = 'vendor/payments-contract/src/';
const paymentOfferSource =
  read(paymentRoot + 'offers.ts') + '\n' + read(paymentRoot + 'amplifi-offers.ts');
const offerIds = [...paymentOfferSource.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]);
assert.equal(new Set(offerIds).size, offerIds.length, 'Commerce offer IDs must be unique');
for (const id of ['website_portal_starter', 'amplifi_social', 'amplifi_intelligence', 'amplifi_complete']) {
  assert.ok(offerIds.includes(id), 'Missing shared commerce offer: ' + id);
}
assert.doesNotMatch(paymentOfferSource, /tarris|bouie/i);
assert.equal(existsSync(join(root, 'vendor/payments-contract/src/catalog.ts')), false);

const tarrisCheckout = read('app/api/checkout/tarris-bouie/route.ts');
assert.match(tarrisCheckout, /commerceOfferId:\s*'tarris_bouie_deposit'/);
assert.match(tarrisCheckout, /unit_amount:\s*50000/);
assert.match(tarrisCheckout, /Tarris Bouie Project Deposit/);

console.log('Vendored platform snapshot, provenance, CRM, and client-isolation checks passed.');
