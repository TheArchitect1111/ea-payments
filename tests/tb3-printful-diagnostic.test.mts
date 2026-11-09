import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTb3PrintfulDiagnosticHandler } from '../lib/tb3/printful-diagnostic-handler';
import { PrintfulError } from '../lib/tb3/printful-transport';

const preview = { vercel: 'preview', branch: 'work/tb3-commerce-hq-20261109' };
const request = new Request('https://preview.example/api/tb3/printful/diagnostic');

function responseBody(response: Response) {
  return response.json();
}

test('diagnostic is branch and Preview scoped before auth or provider access', async () => {
  let authCalls = 0;
  let providerCalls = 0;
  const handler = createTb3PrintfulDiagnosticHandler({
    environment: () => ({ vercel: 'production', branch: preview.branch }),
    authorize: async () => { authCalls++; },
    keyAvailable: () => true,
    readCatalogProduct: async () => { providerCalls++; return { sync_product: { id: 485112609 } }; },
  });

  const response = await handler(request);
  assert.equal(response.status, 404);
  assert.deepEqual(await responseBody(response), { ok: false, error: 'Not found.' });
  assert.equal(authCalls, 0);
  assert.equal(providerCalls, 0);
});

test('diagnostic denies anonymous HQ access without checking key or calling Printful', async () => {
  let keyChecks = 0;
  let providerCalls = 0;
  const handler = createTb3PrintfulDiagnosticHandler({
    environment: () => preview,
    authorize: async () => { throw Object.assign(new Error('private'), { status: 401 }); },
    keyAvailable: () => { keyChecks++; return true; },
    readCatalogProduct: async () => { providerCalls++; return {}; },
  });

  const response = await handler(request);
  assert.equal(response.status, 401);
  assert.deepEqual(await responseBody(response), { ok: false, error: 'Private TB3 HQ access required.' });
  assert.equal(keyChecks, 0);
  assert.equal(providerCalls, 0);
});

test('missing key is reported without a provider request', async () => {
  let providerCalls = 0;
  const handler = createTb3PrintfulDiagnosticHandler({
    environment: () => preview,
    authorize: async () => undefined,
    keyAvailable: () => false,
    readCatalogProduct: async () => { providerCalls++; return {}; },
  });

  const response = await handler(request);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await responseBody(response), {
    keyAvailable: false,
    authentication: 'NOT TESTED',
    storeIdentity: 'UNVERIFIED',
  });
  assert.equal(providerCalls, 0);
});

test('successful read-only sync-product lookup verifies authentication and expected store context', async () => {
  const calls: unknown[][] = [];
  const handler = createTb3PrintfulDiagnosticHandler({
    environment: () => preview,
    authorize: async () => undefined,
    keyAvailable: () => true,
    readCatalogProduct: async (...args) => {
      calls.push(args);
      return { sync_product: { id: 485112609 } };
    },
  });

  const response = await handler(request);
  assert.deepEqual(await responseBody(response), {
    keyAvailable: true,
    authentication: 'PASS',
    storeIdentity: 'VERIFIED',
  });
  assert.deepEqual(calls, [[18945233, 485112609]]);
});

test('401 and 403 mean authentication failure without exposing provider errors or secrets', async (t) => {
  for (const status of [401, 403]) {
    await t.test(String(status), async () => {
      const handler = createTb3PrintfulDiagnosticHandler({
        environment: () => preview,
        authorize: async () => undefined,
        keyAvailable: () => true,
        readCatalogProduct: async () => { throw new PrintfulError(status, 'secret-bearing provider message'); },
      });

      const response = await handler(request);
      const body = await response.text();
      assert.deepEqual(JSON.parse(body), {
        keyAvailable: true,
        authentication: 'FAIL',
        storeIdentity: 'UNVERIFIED',
      });
      assert.doesNotMatch(body, /secret|Bearer|PRINTFUL_API_KEY/i);
    });
  }
});

test('non-auth provider failures do not get mislabeled as credential failures', async () => {
  const handler = createTb3PrintfulDiagnosticHandler({
    environment: () => preview,
    authorize: async () => undefined,
    keyAvailable: () => true,
    readCatalogProduct: async () => { throw new PrintfulError(503, 'provider unavailable'); },
  });

  const response = await handler(request);
  assert.deepEqual(await responseBody(response), {
    keyAvailable: true,
    authentication: 'NOT TESTED',
    storeIdentity: 'UNVERIFIED',
  });
});

test('an unexpected or mismatched product result cannot certify the store identity', async () => {
  const handler = createTb3PrintfulDiagnosticHandler({
    environment: () => preview,
    authorize: async () => undefined,
    keyAvailable: () => true,
    readCatalogProduct: async () => ({ sync_product: { id: 42 } }),
  });

  const response = await handler(request);
  assert.deepEqual(await responseBody(response), {
    keyAvailable: true,
    authentication: 'PASS',
    storeIdentity: 'UNVERIFIED',
  });
});
