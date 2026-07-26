#!/usr/bin/env node
/**
 * Phase 2B ADV-P-1…ADV-P-13 against the memory adapter (shared store).
 * Airtable runs only when PEOPLE_AIRTABLE_CERT=1 and schema verifies — never fabricated.
 *
 * Run: npx tsx scripts/test-people-adv-p.mts
 */
import assert from 'node:assert/strict';
import { memoryPeopleRepository } from '../lib/people/memory-repository.ts';
import { resetPeopleStoreForTests } from '../lib/people/store.ts';
import { runPeopleMergeJob } from '../lib/people/merge-job.ts';
import { orgEmailKey } from '../lib/people/keys.ts';
import {
  isUniversalPeopleEnabled,
  isUniversalPeoplePersistEnabled,
  isPeopleRuntimeAllowed,
} from '../lib/people/flags.ts';
import { getPeopleRepository } from '../lib/people/adapter.ts';
import { PeoplePersistError } from '../lib/people/errors.ts';
import { reconcilePeopleOrganization } from '../lib/people/reconcile.ts';
import { withPeopleRetry } from '../lib/people/retry.ts';
import { validateImportRow } from '../lib/people/import-export.ts';
import { redactPersonForLogs, redactPeopleMeta } from '../lib/people/redact-log.ts';

process.env.PEOPLE_CERT_MEMORY = '1';
process.env.PEOPLE_SHARED_MEMORY = '1';
process.env.PEOPLE_RETRY_MAX_ATTEMPTS = '3';
process.env.PEOPLE_RETRY_MAX_BACKOFF_MS = '50';
delete process.env.UNIVERSAL_PEOPLE;
delete process.env.UNIVERSAL_PEOPLE_PERSIST;
delete process.env.VERCEL_ENV;

const ORG = 'advp_org_alpha';
const ORG_B = 'advp_org_beta';
let passed = 0;
let failed = 0;
const skips: string[] = [];

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

const repo = () => memoryPeopleRepository();

await run('ADV-P-1', async () => {
  const r = repo();
  const input = {
    organizationId: ORG,
    displayName: 'Concurrent Ada',
    emails: [{ value: 'ada.concurrent@example.test', kind: 'primary' as const }],
    phones: [],
    lifecycleStatus: 'active' as const,
    source: 'manual' as const,
  };
  const key = orgEmailKey(ORG, 'ada.concurrent@example.test');
  const results = await Promise.all(
    Array.from({ length: 20 }, () => r.upsertPersonByIdentity(input, { emailKey: key })),
  );
  const ids = new Set(results.map((x) => x.person.id));
  assert.equal(ids.size, 1, `expected 1 person, got ${ids.size}`);
  assert.equal(results.filter((x) => x.created).length, 1);
});

await run('ADV-P-1b', async () => {
  const r = repo();
  const email = 'staff.concurrent@example.test';
  const key = orgEmailKey(ORG, email);
  const mk = () =>
    r.upsertPersonByIdentity(
      {
        organizationId: ORG,
        displayName: 'Staff',
        emails: [{ value: email, kind: 'primary' }],
        phones: [],
        lifecycleStatus: 'active',
        source: 'manual',
      },
      { emailKey: key },
    );
  const [a, b] = await Promise.all([mk(), mk()]);
  assert.equal(a.person.id, b.person.id);
});

await run('ADV-P-2', async () => {
  const r = repo();
  const p = await r.createPerson({
    organizationId: ORG,
    displayName: 'Rel',
    emails: [{ value: 'rel@example.test', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const q = await r.createPerson({
    organizationId: ORG,
    displayName: 'Rel2',
    emails: [{ value: 'rel2@example.test', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  await Promise.all([
    r.upsertRelationship({
      organizationId: ORG,
      fromPersonId: p.id,
      toPersonId: q.id,
      type: 'guardian_of',
      status: 'active',
    }),
    r.upsertRelationship({
      organizationId: ORG,
      fromPersonId: p.id,
      toPersonId: q.id,
      type: 'guardian_of',
      status: 'active',
    }),
  ]);
  const edges = (await r.listRelationshipsForOrg(ORG)).filter(
    (e) => e.fromPersonId === p.id && e.toPersonId === q.id && e.status === 'active',
  );
  assert.equal(edges.length, 1);
});

await run('ADV-P-3', async () => {
  const r = repo();
  const job = await r.createImportJob({
    organizationId: ORG,
    idempotencyKey: `import-${ORG}-file1`,
    actorEmail: 'importer@example.test',
    source: 'staff-import',
    rowCount: 1,
  });
  const again = await r.findImportJobByIdempotencyKey(ORG, `import-${ORG}-file1`);
  assert.equal(again?.id, job.id);
  const row = validateImportRow(
    {
      displayName: 'Imp',
      email: 'imp@example.test',
      roles: ['client'],
    },
    'staff',
  );
  assert.equal(row.ok, true);
});

await run('ADV-P-4', async () => {
  const r = repo();
  const survivor = await r.createPerson({
    organizationId: ORG,
    displayName: 'Survivor',
    emails: [{ value: 'surv@example.test', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const absorbed = await r.createPerson({
    organizationId: ORG,
    displayName: 'Absorbed',
    emails: [{ value: 'abs@example.test', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });

  const midResult = await runPeopleMergeJob({
    repository: r,
    sessionOrganizationId: ORG,
    survivorPersonId: survivor.id,
    absorbedPersonId: absorbed.id,
    actorEmail: 'owner@example.test',
    actorRole: 'owner',
    failAfterStep: 'copy_directory',
  });
  assert.equal(midResult.ok, false);
  assert.equal(midResult.status, 'retryable');

  const mid = await r.getPerson(absorbed.id);
  assert.ok(mid);
  assert.equal(mid.mergedIntoPersonId, undefined);
  assert.notEqual(mid.lifecycleStatus, 'archived');

  const done = await runPeopleMergeJob({
    repository: r,
    sessionOrganizationId: ORG,
    survivorPersonId: survivor.id,
    absorbedPersonId: absorbed.id,
    actorEmail: 'owner@example.test',
    actorRole: 'owner',
  });
  assert.equal(done.ok, true);
  const after = await r.getPerson(absorbed.id);
  assert.equal(after?.mergedIntoPersonId, survivor.id);
  assert.equal(after?.lifecycleStatus, 'archived');
});

await run('ADV-P-5', async () => {
  let attempts = 0;
  await assert.rejects(() =>
    withPeopleRetry(
      async () => {
        attempts += 1;
        throw new Error('429 Too Many Requests');
      },
      { operation: 'rate-test', maxAttempts: 3, maxBackoffMs: 20 },
    ),
  );
  assert.equal(attempts, 3);
});

await run('ADV-P-6', async () => {
  const src = await import('node:fs').then((fs) =>
    fs.readFileSync(new URL('../lib/people/acl.ts', import.meta.url), 'utf8'),
  );
  assert.ok(!/globalThis\.peopleAclCache|lru-cache|crossRequestCache/.test(src));
});

await run('ADV-P-7', async () => {
  const r = repo();
  await assert.rejects(() =>
    r.createPerson({
      organizationId: ORG,
      displayName: 'Bad',
      emails: [{ value: '', kind: 'primary' }],
      phones: [],
      lifecycleStatus: 'active',
      source: 'manual',
    }),
  );
  await assert.rejects(() =>
    r.upsertPersonByIdentity(
      {
        organizationId: ORG,
        displayName: 'No Identity',
        emails: [],
        phones: [],
        lifecycleStatus: 'active',
        source: 'manual',
      },
      {},
    ),
  );
});

await run('ADV-P-8', async () => {
  const r = repo();
  const a = await r.createPerson({
    organizationId: ORG,
    displayName: 'A',
    emails: [{ value: 'a@example.test', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const b = await r.createPerson({
    organizationId: ORG_B,
    displayName: 'B',
    emails: [{ value: 'b@example.test', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const result = await runPeopleMergeJob({
    repository: r,
    sessionOrganizationId: ORG,
    survivorPersonId: a.id,
    absorbedPersonId: b.id,
    actorEmail: 'owner@example.test',
    actorRole: 'owner',
  });
  assert.equal(result.ok, false);
});

await run('ADV-P-9', async () => {
  const r = repo();
  await r.saveMigrationCheckpoint({
    organizationId: ORG,
    jobId: 'backfill-1',
    lastClientRecordId: 'rec_checkpoint_1',
    processed: 1,
    created: 1,
    linked: 0,
    status: 'running',
  });
  const cp = await r.getMigrationCheckpoint(ORG, 'backfill-1');
  assert.equal(cp?.lastClientRecordId, 'rec_checkpoint_1');
  await r.saveMigrationCheckpoint({
    organizationId: ORG,
    jobId: 'backfill-1',
    lastClientRecordId: 'rec_checkpoint_2',
    processed: 2,
    created: 2,
    linked: 0,
    status: 'running',
  });
  const cp2 = await r.getMigrationCheckpoint(ORG, 'backfill-1');
  assert.equal(cp2?.lastClientRecordId, 'rec_checkpoint_2');
  assert.equal(cp2?.processed, 2);
});

await run('ADV-P-10', async () => {
  const redacted = redactPersonForLogs({
    id: 'person_x',
    organizationId: ORG,
    displayName: 'Secret',
    emails: [{ value: 's@example.test', kind: 'primary' }],
    phones: [{ value: '+15555550100', kind: 'mobile' }],
    dateOfBirth: '2010-01-01',
    lifecycleStatus: 'active',
    source: 'manual',
    createdAt: '',
    updatedAt: '',
  });
  assert.ok(redacted);
  assert.equal((redacted as { dateOfBirth?: string }).dateOfBirth, undefined);
  assert.equal(redacted.hasDateOfBirth, true);
  assert.equal(redacted.emailHint, '***@example.test');
  assert.ok(!JSON.stringify(redacted).includes('Secret'));
  assert.ok(!JSON.stringify(redacted).includes('2010-01-01'));
  assert.ok(!JSON.stringify(redacted).includes('+15555550100'));
  const meta = redactPeopleMeta({ dob: '2010-01-01', ok: true, email: 'raw@example.test' });
  assert.equal(meta.dob, '[redacted]');
  assert.equal(meta.email, '***@example.test');
});

await run('ADV-P-11', async () => {
  process.env.UNIVERSAL_PEOPLE = '1';
  delete process.env.UNIVERSAL_PEOPLE_PERSIST;
  process.env.VERCEL_ENV = 'production';
  assert.equal(isUniversalPeopleEnabled(), true);
  assert.equal(isUniversalPeoplePersistEnabled(), false);
  assert.equal(isPeopleRuntimeAllowed(), false);
  delete process.env.UNIVERSAL_PEOPLE;
  delete process.env.VERCEL_ENV;
});

await run('ADV-P-12', async () => {
  process.env.UNIVERSAL_PEOPLE_PERSIST = '1';
  process.env.PEOPLE_CERT_MEMORY = '0';
  delete process.env.AIRTABLE_API_KEY;
  delete process.env.AIRTABLE_PAT;
  let threw = false;
  try {
    getPeopleRepository();
  } catch (err) {
    threw = true;
    assert.ok(err instanceof PeoplePersistError);
    assert.equal(err.code, 'unavailable');
  }
  assert.equal(threw, true);
  delete process.env.UNIVERSAL_PEOPLE_PERSIST;
  process.env.PEOPLE_CERT_MEMORY = '1';
});

await run('ADV-P-13', async () => {
  const r = repo();
  const survivor = await r.createPerson({
    organizationId: ORG,
    displayName: 'Surv',
    emails: [{ value: 'surv13@example.test', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const absorbed = await r.createPerson({
    organizationId: ORG,
    displayName: 'Abs',
    emails: [{ value: 'abs13@example.test', kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const merged = await runPeopleMergeJob({
    repository: r,
    sessionOrganizationId: ORG,
    survivorPersonId: survivor.id,
    absorbedPersonId: absorbed.id,
    actorEmail: 'owner@example.test',
    actorRole: 'owner',
  });
  assert.equal(merged.ok, true);
  const tomb = await r.getPerson(absorbed.id);
  assert.equal(tomb?.mergedIntoPersonId, survivor.id);
});

await run('ADV-P-RECONCILE', async () => {
  const r = repo();
  const report = await reconcilePeopleOrganization(ORG, r);
  assert.equal(report.organizationId, ORG);
  assert.equal(report.ok, true);
});

console.log(`\nADV-P memory summary: ${passed} passed, ${failed} failed`);
if (skips.length) console.log('Skipped (not counted as pass):', skips.join(', '));

if (process.env.PEOPLE_AIRTABLE_CERT === '1') {
  console.log('\nPEOPLE_AIRTABLE_CERT=1 — run schema verify separately; Airtable ADV-P not auto-claimed.');
  skips.push('ADV-P-Airtable-requires-operator-schema');
} else {
  skips.push('ADV-P-Airtable-not-requested');
  console.log(
    'Airtable ADV-P: SKIPPED (set PEOPLE_AIRTABLE_CERT=1 after schema exists) — not counted as pass',
  );
}

if (failed > 0) process.exit(1);
console.log('PASS people-adv-p (memory)');
process.exit(0);
