import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createTb3PrintfulDiagnosticHandler, verifyTb3PrintfulDiagnosticToken } from '../lib/tb3/printful-diagnostic-handler';
import { PrintfulError } from '../lib/tb3/printful-transport';

const preview = { vercel: 'preview', branch: 'work/tb3-commerce-hq-20261109' };
const request = new Request('https://preview.example/api/tb3/printful/diagnostic');
const testToken = 'a'.repeat(43);
const testTokenHash = createHash('sha256').update(testToken).digest('hex');

function responseBody(response: Response) {
  return response.json();
}

test('diagnostic is branch and Preview scoped before auth or provider access', async () => {
  let authCalls = 0;
  let verifierCalls = 0;
  let providerCalls = 0;
  const handler = createTb3PrintfulDiagnosticHandler({
    environment: () => ({ vercel: 'production', branch: preview.branch }),
    authorize: async () => { authCalls++; },
    diagnosticTokenSha256: () => { verifierCalls++; return testTokenHash; },
    keyAvailable: () => true,
    readCatalogProduct: async () => { providerCalls++; return { sync_product: { id: 485112609 } }; },
  });

  const response = await handler(new Request(request, { headers: { 'x-tb3-printful-diagnostic-token': testToken } }));
  assert.equal(response.status, 404);
  assert.deepEqual(await responseBody(response), { ok: false, error: 'Not found.' });
  assert.equal(authCalls, 0);
  assert.equal(verifierCalls, 0);
  assert.equal(providerCalls, 0);
});

test('valid diagnostic token cannot authorize another Preview branch', async () => {
  let verifierCalls = 0;
  let providerCalls = 0;
  const handler = createTb3PrintfulDiagnosticHandler({
    environment: () => ({ vercel: 'preview', branch: 'work/another-branch' }),
    authorize: async () => { throw new Error('not reached'); },
    diagnosticTokenSha256: () => { verifierCalls++; return testTokenHash; },
    keyAvailable: () => true,
    readCatalogProduct: async () => { providerCalls++; return {}; },
  });

  const response = await handler(new Request(request, { headers: { 'x-tb3-printful-diagnostic-token': testToken } }));
  assert.equal(response.status, 404);
  assert.equal(verifierCalls, 0);
  assert.equal(providerCalls, 0);
});

test('diagnostic denies anonymous HQ access without checking key or calling Printful', async () => {
  let keyChecks = 0;
  let providerCalls = 0;
  const handler = createTb3PrintfulDiagnosticHandler({
    environment: () => preview,
    authorize: async () => { throw Object.assign(new Error('private'), { status: 401 }); },
    diagnosticTokenSha256: () => undefined,
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
    diagnosticTokenSha256: () => undefined,
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
    diagnosticTokenSha256: () => undefined,
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
        diagnosticTokenSha256: () => undefined,
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
    diagnosticTokenSha256: () => undefined,
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
    diagnosticTokenSha256: () => undefined,
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

test('a valid endpoint-scoped test credential bypasses HQ login only on the authorized Preview branch', async () => {
  let hqAuthCalls = 0;
  let probeCalls = 0;
  const handler = createTb3PrintfulDiagnosticHandler({
    environment: () => preview,
    authorize: async () => { hqAuthCalls++; throw new Error('HQ login must not be needed with valid diagnostic token'); },
    diagnosticTokenSha256: () => testTokenHash,
    keyAvailable: () => true,
    readCatalogProduct: async () => { probeCalls++; return { sync_product: { id: 485112609 } }; },
  });

  const response = await handler(new Request(request, { headers: { 'x-tb3-printful-diagnostic-token': testToken } }));
  const text = await response.text();
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(text), { keyAvailable: true, authentication: 'PASS', storeIdentity: 'VERIFIED' });
  assert.doesNotMatch(text, new RegExp(testToken));
  assert.equal(hqAuthCalls, 0);
  assert.equal(probeCalls, 1);
});

test('invalid or unconfigured diagnostic credentials fail closed before key checks and provider access', async (t) => {
  for (const [label, supplied, configured] of [
    ['wrong token', 'b'.repeat(43), testTokenHash],
    ['missing verifier', testToken, undefined],
    ['malformed verifier', testToken, 'not-a-sha256-digest'],
  ] as const) {
    await t.test(label, async () => {
      let keyChecks = 0;
      let providerCalls = 0;
      let hqAuthCalls = 0;
      const handler = createTb3PrintfulDiagnosticHandler({
        environment: () => preview,
        authorize: async () => { hqAuthCalls++; },
        diagnosticTokenSha256: () => configured,
        keyAvailable: () => { keyChecks++; return true; },
        readCatalogProduct: async () => { providerCalls++; return {}; },
      });

      const response = await handler(new Request(request, { headers: { 'x-tb3-printful-diagnostic-token': supplied } }));
      const body = await response.text();
      assert.equal(response.status, 401);
      assert.deepEqual(JSON.parse(body), { ok: false, error: 'Private TB3 HQ access required.' });
      assert.doesNotMatch(body, /PRINTFUL_API_KEY|DIAGNOSTIC_TOKEN|Bearer/i);
      assert.equal(keyChecks, 0);
      assert.equal(providerCalls, 0);
      assert.equal(hqAuthCalls, 0, 'an invalid supplied diagnostic token must not fall through to HQ authorization');
    });
  }
});

test('diagnostic token format and SHA-256 verification reject weak or malformed values', () => {
  assert.equal(verifyTb3PrintfulDiagnosticToken(testToken, testTokenHash), true);
  assert.equal(verifyTb3PrintfulDiagnosticToken('short', testTokenHash), false);
  assert.equal(verifyTb3PrintfulDiagnosticToken('x'.repeat(129), testTokenHash), false);
  assert.equal(verifyTb3PrintfulDiagnosticToken(testToken, undefined), false);
  assert.equal(verifyTb3PrintfulDiagnosticToken(testToken, 'not-a-sha256-digest'), false);
});

test('deployed route performs only the fixed read-only product GET and never returns or logs credentials', () => {
  const source = readFileSync('app/api/tb3/printful/diagnostic/route.ts', 'utf8');
  assert.match(source, /tb3Printful<[^>]+>\(`\/store\/products\/\$\{productId\}`, \{ method: 'GET' \}\)/);
  assert.doesNotMatch(source, /\/orders|\/confirm|method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]|console\.(?:log|info|warn|error)/i);
  assert.match(source, /TB3_PRINTFUL_DIAGNOSTIC_TOKEN_SHA256/);
});
