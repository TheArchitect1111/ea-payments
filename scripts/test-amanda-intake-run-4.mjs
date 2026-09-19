import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const submit = readFileSync('app/api/portal/forms/submit/route.ts', 'utf8');
const store = readFileSync('lib/portal-forms/store.ts', 'utf8');
const assets = readFileSync('lib/ctp-asset-store.ts', 'utf8');
const health = readFileSync('app/api/health/amanda-login/route.ts', 'utf8');

assert.ok(submit.includes("requireDurable: slug === 'amanda-catherine' && kind === 'application'"));
assert.ok(submit.includes("storage: route ? 'durable' : undefined"));
assert.ok(submit.includes("status: 503"));
assert.ok(submit.includes("Application storage is temporarily unavailable. Please try again."));
assert.ok(submit.includes('Application contains unsupported uploads.'));
assert.ok(submit.includes('if (!uploads?.[upload])'));
assert.ok(store.includes('if (input.requireDurable)'));
assert.ok(store.includes("throw new Error('Durable application storage is unavailable.')"));
assert.ok(store.includes("throw new Error('Portal form submission could not be saved to durable storage.')"));
assert.ok(assets.includes('if (await persistCtpAssetToStudio(entry.id, organizationId))'));
for (const check of ['authenticatedOwnerV2', 'ownerV2ApplicationQueues', 'authenticatedApplicationStatusApi']) {
  assert.ok(health.includes(check), `missing authenticated Run 4 health check: ${check}`);
}

console.log('Amanda intake Run 4 durability safeguards: PASS');
