import assert from 'node:assert/strict';

/** Controlled PostgREST transport; adapter, flags, provider preflight and installation code remain real. */
export function installPeopleRuntimeFixture() {
  const keys = ['VERCEL_ENV', 'UNIVERSAL_PEOPLE', 'UNIVERSAL_PEOPLE_PERSIST', 'PEOPLE_SUPABASE_URL',
    'PEOPLE_SUPABASE_API_KEY', 'PEOPLE_SUPABASE_KEY', 'PEOPLE_SUPABASE_JWT_SECRET', 'PEOPLE_CERT_MEMORY'];
  const before = new Map(keys.map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const calls: Array<{ organizationId: string; path: string }> = [];
  let unavailable = false;
  Object.assign(process.env, { VERCEL_ENV: 'preview', UNIVERSAL_PEOPLE: '1', UNIVERSAL_PEOPLE_PERSIST: '1',
    PEOPLE_SUPABASE_URL: 'https://people-runtime-fixture.invalid', PEOPLE_SUPABASE_API_KEY: 'fixture-gateway',
    PEOPLE_SUPABASE_KEY: 'fixture-people-app' });
  delete process.env.PEOPLE_SUPABASE_JWT_SECRET; delete process.env.PEOPLE_CERT_MEMORY;
  globalThis.fetch = async (target, init) => {
    const url = new URL(String(target));
    assert.equal(url.origin, 'https://people-runtime-fixture.invalid', 'No real provider calls allowed');
    assert.equal(url.pathname, '/rest/v1/persons');
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('Accept-Profile'), 'people'); assert.equal(headers.get('Content-Profile'), 'people');
    assert.equal(headers.get('apikey'), 'fixture-gateway'); assert.equal(headers.get('Authorization'), 'Bearer fixture-people-app');
    const org = url.searchParams.get('organization_id')!.replace(/^eq\./, '');
    assert.equal(headers.get('X-People-Organization-Id'), org);
    calls.push({ organizationId: org, path: url.pathname });
    return unavailable ? Response.json({ message: 'Fixture schema unavailable' }, { status: 503 }) : Response.json([]);
  };
  return { calls, failSchema() { unavailable = true; }, restore() {
    globalThis.fetch = originalFetch;
    for (const [key, value] of before) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  } };
}
