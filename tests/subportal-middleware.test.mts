import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest, type NextFetchEvent } from 'next/server';
import { middleware } from '../middleware';

test('Subportal routes fail closed with 503 when Clerk is not configured', async () => {
  const previousPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const previousSecretKey = process.env.CLERK_SECRET_KEY;
  delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  delete process.env.CLERK_SECRET_KEY;
  try {
    const request = new NextRequest('https://example.test/portal/subportal-auth');
    const response = await middleware(request, {} as NextFetchEvent);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'Student authentication is not configured.' });
  } finally {
    if (previousPublishableKey === undefined) delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = previousPublishableKey;
    if (previousSecretKey === undefined) delete process.env.CLERK_SECRET_KEY;
    else process.env.CLERK_SECRET_KEY = previousSecretKey;
  }
});

test('unrelated routes continue through the existing middleware path', async () => {
  const request = new NextRequest('https://example.test/');
  const response = await middleware(request, {} as NextFetchEvent);
  assert.equal(response.status, 200);
});
