#!/usr/bin/env node
/**
 * Phase 2C offline contract + memory ADV-P regressions (no live Postgres required).
 * Live Postgres gates run only via runtime-cert-people-phase2c.mts when creds exist.
 *
 * Run: npx tsx scripts/test-people-phase2c-offline.mts
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { getPeopleRepository } from '../lib/people/adapter.ts';
import {
  assertPeoplePersistReady,
  isPeopleRuntimeAllowed,
  isUniversalPeoplePersistEnabled,
} from '../lib/people/flags.ts';
import { isPeoplePersistError, PeoplePersistError } from '../lib/people/errors.ts';
import { ignoreBodyOrganizationId } from '../lib/people/resolve-tenant.ts';
import { validateImportRow } from '../lib/people/import-export.ts';
import { memoryPeopleRepository } from '../lib/people/memory-repository.ts';
import { resetPeopleStoreForTests } from '../lib/people/store.ts';
import { orgEmailKey } from '../lib/people/keys.ts';

process.env.PEOPLE_CERT_MEMORY = '1';
process.env.PEOPLE_SHARED_MEMORY = '1';
delete process.env.UNIVERSAL_PEOPLE;
delete process.env.UNIVERSAL_PEOPLE_PERSIST;
delete process.env.VERCEL_ENV;
delete process.env.PEOPLE_SUPABASE_URL;
delete process.env.PEOPLE_SUPABASE_KEY;
delete process.env.PEOPLE_SUPABASE_APP_KEY;

let passed = 0;
let failed = 0;
const skipped: string[] = [];

async function run(id: string, fn: () => void | Promise<void>) {
  resetPeopleStoreForTests();
  try {
    await fn();
    passed += 1;
    console.log(`PASS ${id}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${id}:`, err instanceof Error ? err.message : err);
  }
}

function skip(id: string, reason: string) {
  skipped.push(`${id}: ${reason}`);
  console.log(`SKIP ${id}: ${reason}`);
}

await run('2C-OFF-1 adapter never imports airtable-repository', () => {
  const src = readFileSync(join(process.cwd(), 'lib/people/adapter.ts'), 'utf8');
  assert.ok(!src.includes('airtable-repository'));
  assert.ok(src.includes('postgresPeopleRepository'));
});

await run('2C-OFF-2 quarantine marker present', () => {
  assert.ok(existsSync('lib/people/_quarantine_airtable_sor/README.ts'));
  assert.ok(existsSync('lib/people/_quarantine_airtable_sor/airtable-repository.ts'));
  assert.ok(!existsSync('lib/people/airtable-repository.ts'));
  assert.ok(!existsSync('lib/people/airtable-tables.ts'));
});

await run('2C-OFF-3 migration file present', () => {
  const sql = readFileSync('supabase/migrations/007_people_phase2c_schema.sql', 'utf8');
  assert.ok(sql.includes('CREATE SCHEMA IF NOT EXISTS people'));
  assert.ok(sql.includes('people.ensure_person'));
  assert.ok(sql.includes('people.merge_finalize'));
  assert.ok(sql.includes('REVOKE ALL ON SCHEMA people FROM service_role'));
  assert.ok(sql.includes('deny_audit_mutation'));
  assert.ok(sql.includes('FORCE ROW LEVEL SECURITY'));
});

await run('2C-OFF-4 Persist ON without Postgres → unavailable (INV-19)', () => {
  delete process.env.PEOPLE_CERT_MEMORY;
  process.env.UNIVERSAL_PEOPLE_PERSIST = '1';
  delete process.env.PEOPLE_SUPABASE_URL;
  delete process.env.PEOPLE_SUPABASE_KEY;
  assert.throws(() => assertPeoplePersistReady(), (e: unknown) => {
    assert.ok(isPeoplePersistError(e));
    assert.equal((e as PeoplePersistError).code, 'unavailable');
    return true;
  });
  assert.throws(() => getPeopleRepository(), (e: unknown) => isPeoplePersistError(e));
  process.env.PEOPLE_CERT_MEMORY = '1';
  delete process.env.UNIVERSAL_PEOPLE_PERSIST;
});

await run('2C-OFF-5 People ON Persist OFF prod mode denied (INV-20 / ADV-P-11)', () => {
  process.env.UNIVERSAL_PEOPLE = '1';
  delete process.env.UNIVERSAL_PEOPLE_PERSIST;
  process.env.VERCEL_ENV = 'production';
  assert.equal(isPeopleRuntimeAllowed(), false);
  delete process.env.VERCEL_ENV;
  delete process.env.UNIVERSAL_PEOPLE;
});

await run('2C-OFF-6 body organizationId stripped (ADV-P-7)', () => {
  const body = ignoreBodyOrganizationId({
    organizationId: 'evil-org',
    displayName: 'X',
  });
  assert.equal('organizationId' in body, false);
});

await run('2C-OFF-7 import cannot elevate PlatformRole', () => {
  const bad = validateImportRow(
    {
      displayName: 'Hack',
      email: 'hack@example.test',
      roles: ['admin'],
    },
    'staff',
  );
  assert.equal(bad.ok, false);
});

await run('2C-OFF-8 memory concurrent ensure still unique', async () => {
  const r = memoryPeopleRepository();
  const email = 'phase2c.offline@example.test';
  const key = orgEmailKey('org_2c', email);
  const input = {
    organizationId: 'org_2c',
    displayName: 'Offline',
    emails: [{ value: email, kind: 'primary' as const }],
    phones: [],
    lifecycleStatus: 'active' as const,
    source: 'manual' as const,
  };
  const results = await Promise.all(
    Array.from({ length: 16 }, () => r.upsertPersonByIdentity(input, { emailKey: key })),
  );
  assert.equal(new Set(results.map((x) => x.person.id)).size, 1);
  assert.equal(results.filter((x) => x.created).length, 1);
});

await run('2C-OFF-9 flags default off in example', () => {
  const ex = readFileSync('.env.example', 'utf8');
  assert.ok(/UNIVERSAL_PEOPLE=\s*$/m.test(ex) || /UNIVERSAL_PEOPLE=\n/.test(ex));
  assert.ok(ex.includes('PEOPLE_SUPABASE_URL'));
  assert.ok(!ex.includes('Phase 2B — durable Airtable People SoR'));
});

await run('2C-OFF-10 Persist flag name means Postgres ready', () => {
  assert.equal(isUniversalPeoplePersistEnabled(), false);
});

// Live Postgres ADV-P-* are NOT run here — must not count as pass when skipped.
skip('ADV-P-1-PG', 'requires isolated PEOPLE_SUPABASE_* cert project');
skip('ADV-P-12', 'requires service_role negative against cert DB');

console.log(
  JSON.stringify({
    suite: 'people-phase2c-offline',
    passed,
    failed,
    skipped: skipped.length,
    skippedIds: skipped,
    note: 'Skipped live Postgres tests are NOT passes',
  }),
);
process.exit(failed > 0 ? 1 : 0);
