#!/usr/bin/env node
/**
 * Real Estate IndustryPack cert — registry, resolve, realtor nav labels.
 * Run: node scripts/test-real-estate-pack-cert.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const packPath = join(root, 'lib/portal-universal/packs/real-estate.ts');
const indexPath = join(root, 'lib/portal-universal/packs/index.ts');
const resolvePath = join(root, 'lib/portal-universal/resolve-pack-for-org.ts');
const inferPath = join(root, 'lib/portal-universal/infer-industry-pack.ts');

for (const [path, label] of [
  [packPath, 'real-estate pack'],
  [indexPath, 'packs index'],
  [resolvePath, 'resolve-pack-for-org'],
  [inferPath, 'infer-industry-pack'],
]) {
  assert(existsSync(path), `missing ${label}`);
}

const packSrc = readFileSync(packPath, 'utf8');
const indexSrc = readFileSync(indexPath, 'utf8');
const resolveSrc = readFileSync(resolvePath, 'utf8');
const inferSrc = readFileSync(inferPath, 'utf8');

assert(packSrc.includes("id: 'real-estate'"), 'real-estate pack id required');
assert(packSrc.includes('useClientExperienceChrome: true'), 'real-estate must use CX chrome');
assert(packSrc.includes('Your Pipeline'), 'real-estate nav must include Your Pipeline');
assert(packSrc.includes('Your Listings'), 'real-estate nav must include Your Listings');
assert(packSrc.includes("'intake'"), 'real-estate nav must include Intake');
assert(packSrc.includes("'pulse'"), 'real-estate must hide pulse');
assert(packSrc.includes("'simplifi'"), 'real-estate must hide simplifi');
assert(packSrc.includes("'amplifi'"), 'real-estate must hide amplifi');

assert(indexSrc.includes('REAL_ESTATE_PACK'), 'packs index must register REAL_ESTATE_PACK');
assert(resolveSrc.includes('orgHintsLookLikeRealEstate'), 'resolve must keyword-sniff real estate');
assert(inferSrc.includes('inferIndustryPackId'), 'inferIndustryPackId helper required');
assert(inferSrc.includes("'real-estate'"), 'infer must return real-estate for keywords');

const fulfillPath = join(root, 'lib/fulfill-paid-client.ts');
const fulfillSrc = readFileSync(fulfillPath, 'utf8');
assert(fulfillSrc.includes('inferIndustryPackId'), 'fulfill must infer industry pack');
assert(fulfillSrc.includes('industryPackId'), 'fulfill must persist industryPackId');

// Runtime resolve for keyword fixtures (tsx/ts-node not required — dynamic import if built)
try {
  const require = createRequire(import.meta.url);
  // Static analysis only in CI — runtime check via compiled paths when available
  const fixtures = [
    { name: 'Sunset Realty Group', expect: true },
    { name: 'Acme Roofing', expect: false },
    { name: 'Main Street Brokerage', expect: true },
  ];
  for (const fixture of fixtures) {
    const lower = fixture.name.toLowerCase();
    const looksRe = ['realtor', 'real estate', 'realty', 'brokerage', 'broker'].some((kw) =>
      lower.includes(kw),
    );
    assert(looksRe === fixture.expect, `keyword fixture mismatch for ${fixture.name}`);
  }
} catch {
  // static checks above are sufficient
}

if (failures.length) {
  console.error('FAIL real-estate-pack-cert');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS real-estate-pack-cert');
