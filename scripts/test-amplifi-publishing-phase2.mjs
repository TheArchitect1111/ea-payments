/**
 * Amplifi Phase 2 publishing lifecycle contract.
 * Run: node scripts/test-amplifi-publishing-phase2.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  const path = join(root, rel);
  if (!existsSync(path)) throw new Error(`Missing ${rel}`);
  return readFileSync(path, 'utf8');
}

let failed = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failed += 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

const amplifi = read('lib/amplifi-publish.ts');
const publishingTypes = read('lib/publishing/types.ts');
const studioTypes = read('lib/creative-studio/types.ts');
const publishAsset = read('lib/creative-studio/publish-asset.ts');

assert(publishingTypes.includes("'blocked' | 'queued' | 'published' | 'failed'"), 'publishing lifecycle statuses exist');
assert(publishingTypes.includes('externalId?: string'), 'provider post ID is modeled');
assert(publishingTypes.includes('idempotencyKey?: string'), 'idempotency key is modeled');
assert(publishingTypes.includes('retryable: boolean'), 'retryability is modeled');

assert(amplifi.includes("'Idempotency-Key': idempotencyKey"), 'provider request sends idempotency header');
assert(amplifi.includes("receipt.status === 'published' && receipt.externalId"), 'published requires provider confirmation and external ID');
assert(amplifi.includes("status: 'blocked'"), 'missing provider is blocked, not successful');
assert(amplifi.includes(" : 'queued'"), 'successful handoff can remain queued');

assert(studioTypes.includes("'queued'"), 'campaign asset supports queued status');
assert(studioTypes.includes("'failed'"), 'campaign asset supports failed status');
assert(studioTypes.includes("'blocked'"), 'campaign asset supports blocked status');
assert(studioTypes.includes('publishReceipt?: PublishReceipt'), 'asset stores publish receipt');

assert(publishAsset.includes("asset.status === 'published' && asset.publishReceipt?.externalId"), 'confirmed posts are duplicate protected');
assert(publishAsset.includes('status: assetStatus(result)'), 'asset uses provider lifecycle status');
assert(!publishAsset.includes("result.ok ? ('published' as const)"), 'webhook acceptance no longer means published');
assert(publishAsset.includes('creative-studio.publish.${result.status}'), 'audit event records exact status');

process.exit(failed ? 1 : 0);
