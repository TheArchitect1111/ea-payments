import test from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../app/api/chassis/[client]/contract/route';

test('unprovisioned preview checkout is an unavailable optional state, not an HTTP failure', async () => {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = 'preview';
  try {
    const response = await GET(new Request('https://example.test/api/chassis/tarris/contract'), { params: Promise.resolve({ client: 'tarris' }) });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { available: false });
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
});

test('the contract preview endpoint remains unavailable outside preview and development', async () => {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = 'production';
  try {
    const response = await GET(new Request('https://example.test/api/chassis/tarris/contract'), { params: Promise.resolve({ client: 'tarris' }) });
    assert.equal(response.status, 404);
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
});
