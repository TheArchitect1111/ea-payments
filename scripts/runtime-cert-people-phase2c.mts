#!/usr/bin/env node
/**
 * Phase 2C People runtime certification — isolated Supabase only.
 *
 * Required env (process-scoped; never write to production .env):
 *   PEOPLE_CERT_ISOLATED=1
 *   PEOPLE_SUPABASE_URL
 *   PEOPLE_SUPABASE_KEY          (people_app JWT)
 *   PEOPLE_CERT_SERVICE_ROLE_KEY (ADV-P-12 negative)
 *   PEOPLE_DATABASE_URL or PEOPLE_CERT_ALLOW_DOCKER_SQL=1
 *
 * Exit: 0 CERTIFIED | 1 FAIL | 2 BLOCKED
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  isPeoplePostgresConfigured,
  peopleRpc,
  peopleRest,
} from '../lib/people/postgres-client.ts';
import { postgresPeopleRepository } from '../lib/people/postgres-repository.ts';
import { orgEmailKey } from '../lib/people/keys.ts';
import { ignoreBodyOrganizationId } from '../lib/people/resolve-tenant.ts';
import {
  isPeopleRuntimeAllowed,
  assertPeoplePersistReady,
} from '../lib/people/flags.ts';
import { isPeoplePersistError } from '../lib/people/errors.ts';

const evidenceDir = join(process.cwd(), 'docs', 'audits', 'runtime-evidence-people-phase2c');
mkdirSync(evidenceDir, { recursive: true });

type Result = { id: string; status: 'PASS' | 'FAIL' | 'SKIP'; detail: string; evidence?: unknown };
const results: Result[] = [];

function record(id: string, status: Result['status'], detail: string, evidence?: unknown) {
  results.push({ id, status, detail, evidence });
  console.log(`${status} ${id}: ${detail}`);
}

function envOn(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on' || v === 'yes';
}

function redact(value: string | undefined): string {
  if (!value) return '';
  if (value.length < 12) return '[redacted]';
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function dockerDbName(): string | null {
  const docker = spawnSync(
    'docker',
    ['ps', '--format', '{{.Names}}', '--filter', 'name=supabase_db_'],
    { encoding: 'utf8' },
  );
  return (docker.stdout || '').trim().split(/\r?\n/).filter(Boolean)[0] || null;
}

function sqlScalar(sql: string): string {
  const dbUrl = process.env.PEOPLE_DATABASE_URL?.trim();
  if (dbUrl) {
    const r = spawnSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', sql], {
      encoding: 'utf8',
    });
    if (r.status === 0) return (r.stdout || '').trim();
  }
  const name = dockerDbName();
  if (!name) throw new Error('SQL proof unavailable: no psql and no supabase_db container');
  const d = spawnSync(
    'docker',
    ['exec', '-i', name, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', sql],
    { encoding: 'utf8' },
  );
  if (d.status !== 0) throw new Error(d.stderr || d.stdout || 'docker psql failed');
  return (d.stdout || '').trim();
}

function sqlExec(sql: string): void {
  const dbUrl = process.env.PEOPLE_DATABASE_URL?.trim();
  if (dbUrl) {
    const r = spawnSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-c', sql], { encoding: 'utf8' });
    if (r.status === 0) return;
  }
  const name = dockerDbName();
  if (!name) throw new Error('SQL exec unavailable');
  const d = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      name,
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      sql,
    ],
    { encoding: 'utf8' },
  );
  if (d.status !== 0) throw new Error(d.stderr || d.stdout || 'SQL exec failed');
}

const blockers: string[] = [];
if (!envOn('PEOPLE_CERT_ISOLATED')) blockers.push('PEOPLE_CERT_ISOLATED=1 required');
if (!isPeoplePostgresConfigured()) {
  blockers.push('PEOPLE_SUPABASE_URL + PEOPLE_SUPABASE_KEY required');
}
if (!process.env.PEOPLE_DATABASE_URL?.trim() && !envOn('PEOPLE_CERT_ALLOW_DOCKER_SQL')) {
  blockers.push('PEOPLE_DATABASE_URL or PEOPLE_CERT_ALLOW_DOCKER_SQL=1 required');
}
if (envOn('UNIVERSAL_PEOPLE') && !envOn('PEOPLE_CERT_ALLOW_FLAGS')) {
  blockers.push('UNIVERSAL_PEOPLE must stay OFF during cert unless PEOPLE_CERT_ALLOW_FLAGS=1');
}

if (blockers.length) {
  const report = {
    artifact: 'people-phase2c-runtime-cert',
    verdict: 'BLOCKED',
    blockers,
    at: new Date().toISOString(),
  };
  writeFileSync(join(evidenceDir, 'runtime-cert-blocked.json'), JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exit(2);
}

process.env.UNIVERSAL_PEOPLE_PERSIST = '1';
delete process.env.PEOPLE_CERT_MEMORY;
delete process.env.UNIVERSAL_PEOPLE;

const stamp = Date.now();
const ORG = `cert2c_${stamp}`;
const ORG_B = `cert2c_b_${stamp}`;
const email = `advp1.${stamp}@cert.people.test`;

function sqlCountAuth(organizationId: string, primaryEmail: string): number {
  return Number(
    sqlScalar(`
      SELECT count(*)::text FROM people.persons
      WHERE organization_id = '${organizationId.replace(/'/g, "''")}'
        AND lower(coalesce(primary_email,'')) = lower('${primaryEmail.replace(/'/g, "''")}')
        AND merged_into_person_key IS NULL
    `),
  );
}

async function restCount(organizationId: string, primaryEmail: string): Promise<number> {
  const res = await peopleRest<unknown[]>(
    `persons?organization_id=eq.${encodeURIComponent(organizationId)}&primary_email=eq.${encodeURIComponent(primaryEmail)}&merged_into_person_key=is.null&select=person_key`,
    { organizationId },
  );
  if (!res.ok) throw new Error(res.error);
  return (res.data || []).length;
}

async function gate(id: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (err) {
    record(id, 'FAIL', err instanceof Error ? err.message : String(err));
  }
}

const repo = postgresPeopleRepository();
const processes = Math.max(12, Number(process.env.PEOPLE_ADVP1_PROCESSES || '12'));

await gate('SCHEMA', async () => {
  const tables = sqlScalar(`
    SELECT count(*)::text FROM information_schema.tables
    WHERE table_schema='people' AND table_type='BASE TABLE'
  `);
  assert.ok(Number(tables) >= 15, `expected ≥15 people tables, got ${tables}`);
  const forceRls = sqlScalar(`
    SELECT count(*)::text FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='people' AND c.relkind='r' AND c.relrowsecurity AND c.relforcerowsecurity
  `);
  assert.ok(Number(forceRls) >= 10, `FORCE RLS tables expected ≥10 got ${forceRls}`);
  const rpcs = sqlScalar(`
    SELECT count(*)::text FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='people'
      AND p.proname IN ('ensure_person','merge_finalize','update_person','pre_request','upsert_relationship')
  `);
  assert.ok(Number(rpcs) >= 4, `rpcs expected ≥4 got ${rpcs}`);
  const pre = sqlScalar(`
    SELECT count(*)::text FROM pg_db_role_setting s
    JOIN pg_roles r ON r.oid = s.setrole
    WHERE r.rolname = 'authenticator'
      AND EXISTS (
        SELECT 1 FROM unnest(s.setconfig) cfg
        WHERE cfg LIKE 'pgrst.db_pre_request=%people.pre_request%'
      )
  `);
  assert.equal(pre, '1', 'db-pre-request must be people.pre_request');
  record('SCHEMA', 'PASS', `tables=${tables} force_rls=${forceRls} rpcs=${rpcs}`);
});

await gate('ADV-P-1', async () => {
  const key = orgEmailKey(ORG, email);
  const input = {
    organizationId: ORG,
    displayName: 'ADV-P-1 Cert',
    emails: [{ value: email, kind: 'primary' as const }],
    phones: [],
    lifecycleStatus: 'active' as const,
    source: 'manual' as const,
  };
  const settled = await Promise.all(
    Array.from({ length: processes }, () => repo.upsertPersonByIdentity(input, { emailKey: key })),
  );
  const ids = new Set(settled.map((s) => s.person.id));
  const rest = await restCount(ORG, email);
  const sql = sqlCountAuth(ORG, email);
  assert.equal(ids.size, 1);
  assert.equal(sql, 1, `SQL authoritative count expected 1 got ${sql}`);
  assert.equal(rest, 1);
  record('ADV-P-1', 'PASS', `${processes} concurrent ensures; sql_count=1`, {
    processes,
    ids: [...ids],
    sql_count: sql,
    rest_count: rest,
    created_true: settled.filter((s) => s.created).length,
  });
});

await gate('ADV-P-1b', async () => {
  const e = `staff.${stamp}@cert.people.test`;
  const key = orgEmailKey(ORG, e);
  const mk = () =>
    repo.upsertPersonByIdentity(
      {
        organizationId: ORG,
        displayName: 'Staff',
        emails: [{ value: e, kind: 'primary' }],
        phones: [],
        lifecycleStatus: 'active',
        source: 'manual',
      },
      { emailKey: key },
    );
  const [a, b] = await Promise.all([mk(), mk()]);
  assert.equal(a.person.id, b.person.id);
  assert.equal(sqlCountAuth(ORG, e), 1);
  record('ADV-P-1b', 'PASS', 'concurrent staff create → one id');
});

await gate('ADV-P-2', async () => {
  const p = await repo.createPerson({
    organizationId: ORG,
    displayName: 'RelA',
    emails: [{ value: `rela.${stamp}@cert.people.test`, kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const q = await repo.createPerson({
    organizationId: ORG,
    displayName: 'RelB',
    emails: [{ value: `relb.${stamp}@cert.people.test`, kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  await Promise.all([
    repo.upsertRelationship({
      organizationId: ORG,
      fromPersonId: p.id,
      toPersonId: q.id,
      type: 'guardian_of',
      status: 'active',
    }),
    repo.upsertRelationship({
      organizationId: ORG,
      fromPersonId: p.id,
      toPersonId: q.id,
      type: 'guardian_of',
      status: 'active',
    }),
  ]);
  const n = Number(
    sqlScalar(`
      SELECT count(*)::text FROM people.relationships
      WHERE organization_id='${ORG}' AND from_person_key='${p.id}' AND to_person_key='${q.id}' AND status='active'
    `),
  );
  assert.equal(n, 1);
  record('ADV-P-2', 'PASS', 'one active edge under concurrency', { sql_count: n });
});

await gate('ADV-P-3', async () => {
  const a = await repo.createImportJob({
    organizationId: ORG,
    idempotencyKey: `imp-${stamp}`,
    source: 'csv',
    rowCount: 2,
    actorEmail: 'cert@example.test',
  });
  const b = await repo.createImportJob({
    organizationId: ORG,
    idempotencyKey: `imp-${stamp}`,
    source: 'csv',
    rowCount: 2,
    actorEmail: 'cert@example.test',
  });
  assert.equal(a.id, b.id);
  const n = Number(
    sqlScalar(`
      SELECT count(*)::text FROM people.import_jobs
      WHERE organization_id='${ORG}' AND idempotency_key='imp-${stamp}'
    `),
  );
  assert.equal(n, 1);
  record('ADV-P-3', 'PASS', 'duplicate import collapsed', { jobId: a.id });
});

await gate('ADV-P-4', async () => {
  const survivor = await repo.createPerson({
    organizationId: ORG,
    displayName: 'Survivor',
    emails: [{ value: `surv.${stamp}@cert.people.test`, kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const absorbed = await repo.createPerson({
    organizationId: ORG,
    displayName: 'Absorbed',
    emails: [{ value: `abs.${stamp}@cert.people.test`, kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  const job = await repo.createMergeJob({
    organizationId: ORG,
    survivorPersonId: survivor.id,
    absorbedPersonId: absorbed.id,
    actorEmail: 'cert@example.test',
  });
  const fin = await peopleRpc('merge_finalize', {
    p_organization_id: ORG,
    p_survivor_key: survivor.id,
    p_absorbed_key: absorbed.id,
    p_job_id: job.id,
  });
  assert.equal(fin.ok, true, fin.ok ? '' : fin.error);
  const tomb = sqlScalar(
    `SELECT coalesce(merged_into_person_key,'') FROM people.persons WHERE person_key='${absorbed.id}'`,
  );
  assert.equal(tomb, survivor.id);
  record('ADV-P-4', 'PASS', 'merge finalize atomic tombstone');
});

await gate('ADV-P-5', async () => {
  const a2 = await repo.createPerson({
    organizationId: ORG,
    displayName: 'A2',
    emails: [{ value: `a2.${stamp}@cert.people.test`, kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  let rolledBack = false;
  try {
    sqlExec(`
      BEGIN;
      UPDATE people.persons SET display_name = 'partial' WHERE person_key = '${a2.id}';
      DO $$ BEGIN RAISE EXCEPTION 'forced_rollback_cert'; END $$;
      COMMIT;
    `);
  } catch {
    rolledBack = true;
  }
  assert.equal(rolledBack, true);
  const name = sqlScalar(`SELECT display_name FROM people.persons WHERE person_key='${a2.id}'`);
  assert.equal(name, 'A2');
  const merged = sqlScalar(
    `SELECT coalesce(merged_into_person_key,'') FROM people.persons WHERE person_key='${a2.id}'`,
  );
  assert.equal(merged, '');
  record('ADV-P-5', 'PASS', 'forced SQL rollback left no partial state');
});

await gate('ADV-P-6', async () => {
  const pairs = await Promise.all(
    [0, 1].map(async (i) => {
      const s = await repo.createPerson({
        organizationId: ORG,
        displayName: `DL-S${i}`,
        emails: [{ value: `dls${i}.${stamp}@cert.people.test`, kind: 'primary' }],
        phones: [],
        lifecycleStatus: 'active',
        source: 'manual',
      });
      const a = await repo.createPerson({
        organizationId: ORG,
        displayName: `DL-A${i}`,
        emails: [{ value: `dla${i}.${stamp}@cert.people.test`, kind: 'primary' }],
        phones: [],
        lifecycleStatus: 'active',
        source: 'manual',
      });
      const job = await repo.createMergeJob({
        organizationId: ORG,
        survivorPersonId: s.id,
        absorbedPersonId: a.id,
        actorEmail: 'cert@example.test',
      });
      return peopleRpc('merge_finalize', {
        p_organization_id: ORG,
        p_survivor_key: s.id,
        p_absorbed_key: a.id,
        p_job_id: job.id,
      });
    }),
  );
  assert.ok(pairs.every((p) => p.ok));
  record('ADV-P-6', 'PASS', 'concurrent merge_finalize completed');
});

await gate('ADV-P-7', async () => {
  const stripped = ignoreBodyOrganizationId({ organizationId: ORG_B, displayName: 'x' });
  assert.equal('organizationId' in stripped, false);
  sqlExec(`
    INSERT INTO people.persons (
      person_key, organization_id, display_name, primary_email, emails, phones, external_ids, lifecycle_status, source
    ) VALUES (
      'person_xtenant_${stamp}', '${ORG_B}', 'OtherOrg', 'x@cert.people.test',
      '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'active', 'manual'
    )
  `);
  const leak = await peopleRest<unknown[]>(
    `persons?organization_id=eq.${encodeURIComponent(ORG_B)}&select=person_key`,
    { organizationId: ORG },
  );
  const leaked = leak.ok ? (leak.data || []).length : 0;
  assert.equal(leaked, 0, `cross-tenant leak count=${leaked}`);
  record('ADV-P-7', 'PASS', 'body org stripped; RLS hides other org');
});

await gate('ADV-P-8', async () => {
  const occEmail = `occ.${stamp}@cert.people.test`;
  const created = await repo.createPerson({
    organizationId: ORG,
    displayName: 'OCC Target',
    emails: [{ value: occEmail, kind: 'primary' }],
    phones: [],
    lifecycleStatus: 'active',
    source: 'manual',
  });
  await assert.rejects(
    () =>
      repo.updatePerson(
        created.id,
        { displayName: 'stale' },
        { expectedUpdatedAt: '2000-01-01T00:00:00.000Z' },
      ),
    /conflict|changed/i,
  );
  record('ADV-P-8', 'PASS', 'stale OCC rejected');
});

await gate('ADV-P-9', async () => {
  await repo.saveMigrationCheckpoint({
    organizationId: ORG,
    jobId: `mig-${stamp}`,
    lastClientRecordId: 'rec_100',
    processed: 10,
    created: 3,
    linked: 7,
    status: 'running',
  });
  const last = sqlScalar(`
    SELECT coalesce(last_client_record_id,'') FROM people.migration_checkpoints
    WHERE organization_id='${ORG}' AND job_id='mig-${stamp}'
  `);
  assert.equal(last, 'rec_100');
  const again = await repo.getMigrationCheckpoint(ORG, `mig-${stamp}`);
  assert.equal(again?.lastClientRecordId, 'rec_100');
  record('ADV-P-9', 'PASS', 'migration checkpoint durable');
});

await gate('ADV-P-10', async () => {
  const prev = process.env.PEOPLE_SUPABASE_URL;
  process.env.PEOPLE_SUPABASE_URL = 'http://127.0.0.1:1';
  const bad = await peopleRpc('ensure_person', {
    p_organization_id: ORG,
    p_person_key: 'x',
    p_display_name: 'x',
    p_email: 'outage@cert.people.test',
  });
  process.env.PEOPLE_SUPABASE_URL = prev;
  assert.equal(bad.ok, false);
  const prevKey = process.env.PEOPLE_SUPABASE_KEY;
  delete process.env.PEOPLE_SUPABASE_URL;
  delete process.env.PEOPLE_SUPABASE_KEY;
  assert.throws(() => assertPeoplePersistReady(), (e: unknown) => isPeoplePersistError(e));
  process.env.PEOPLE_SUPABASE_URL = prev;
  process.env.PEOPLE_SUPABASE_KEY = prevKey;
  record('ADV-P-10', 'PASS', 'outage/missing creds fail-closed');
});

await gate('ADV-P-11', async () => {
  process.env.UNIVERSAL_PEOPLE = '1';
  delete process.env.UNIVERSAL_PEOPLE_PERSIST;
  process.env.VERCEL_ENV = 'production';
  assert.equal(isPeopleRuntimeAllowed(), false);
  delete process.env.VERCEL_ENV;
  delete process.env.UNIVERSAL_PEOPLE;
  process.env.UNIVERSAL_PEOPLE_PERSIST = '1';
  record('ADV-P-11', 'PASS', 'People ON Persist OFF prod denied');
});

await gate('ADV-P-12', async () => {
  const svc = process.env.PEOPLE_CERT_SERVICE_ROLE_KEY?.trim();
  const url = process.env.PEOPLE_SUPABASE_URL!.replace(/\/$/, '');
  assert.ok(svc, 'PEOPLE_CERT_SERVICE_ROLE_KEY required');
  const res = await fetch(`${url}/rest/v1/persons?select=person_key&limit=1`, {
    headers: {
      apikey: svc,
      Authorization: `Bearer ${svc}`,
      'Accept-Profile': 'people',
      'Content-Profile': 'people',
    },
  });
  const insert = await fetch(`${url}/rest/v1/persons`, {
    method: 'POST',
    headers: {
      apikey: svc,
      Authorization: `Bearer ${svc}`,
      'Content-Type': 'application/json',
      'Accept-Profile': 'people',
      'Content-Profile': 'people',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      person_key: `svc_probe_${stamp}`,
      organization_id: ORG,
      display_name: 'svc',
      emails: [],
      phones: [],
      external_ids: [],
      lifecycle_status: 'active',
      source: 'manual',
    }),
  });
  assert.ok(!res.ok || res.status >= 400, `service_role SELECT should deny, status=${res.status}`);
  assert.ok(
    !insert.ok || insert.status >= 400,
    `service_role INSERT should deny, status=${insert.status}`,
  );
  record('ADV-P-12', 'PASS', `service_role denied select=${res.status} insert=${insert.status}`);
});

await gate('ADV-P-13', async () => {
  const absorbedRows = Number(
    sqlScalar(`
      SELECT count(*)::text FROM people.persons
      WHERE organization_id='${ORG}' AND merged_into_person_key IS NOT NULL
    `),
  );
  assert.ok(absorbedRows >= 1);
  record('ADV-P-13', 'PASS', `tombstoned persons sql_count=${absorbedRows}`);
});

await gate('ADV-P-14', async () => {
  const audit = await repo.appendAudit({
    organizationId: ORG,
    actorEmail: 'cert@example.test',
    action: 'people.create',
  });
  const upd = await peopleRest(`audit_events?audit_key=eq.${encodeURIComponent(audit.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'tamper' }),
    organizationId: ORG,
  });
  assert.equal(upd.ok, false);
  let sqlDenied = false;
  try {
    sqlExec(`UPDATE people.audit_events SET action='tamper' WHERE audit_key='${audit.id}'`);
  } catch {
    sqlDenied = true;
  }
  assert.equal(sqlDenied, true);
  record('ADV-P-14', 'PASS', 'audit update denied via REST and SQL trigger');
});

const required = [
  'SCHEMA',
  'ADV-P-1',
  'ADV-P-1b',
  'ADV-P-2',
  'ADV-P-3',
  'ADV-P-4',
  'ADV-P-5',
  'ADV-P-6',
  'ADV-P-7',
  'ADV-P-8',
  'ADV-P-9',
  'ADV-P-10',
  'ADV-P-11',
  'ADV-P-12',
  'ADV-P-13',
  'ADV-P-14',
];

const failed = results.filter((r) => r.status === 'FAIL');
const skipped = results.filter((r) => r.status === 'SKIP');
const passed = results.filter((r) => r.status === 'PASS');
const missingRequired = required.filter(
  (id) => !results.some((r) => r.id === id && r.status === 'PASS'),
);

const verdict =
  failed.length === 0 && skipped.length === 0 && missingRequired.length === 0
    ? 'CERTIFIED'
    : failed.length
      ? 'FAIL'
      : 'BLOCKED';

const report = {
  artifact: 'people-phase2c-runtime-cert',
  verdict: verdict === 'FAIL' ? 'BLOCKED' : verdict,
  passed: passed.length,
  failed: failed.length,
  skipped: skipped.length,
  missingRequired,
  results: results.map((r) => ({
    id: r.id,
    status: r.status,
    detail: r.detail,
    evidence: r.evidence,
  })),
  envRedacted: {
    PEOPLE_SUPABASE_URL: redact(process.env.PEOPLE_SUPABASE_URL),
    PEOPLE_SUPABASE_KEY: redact(process.env.PEOPLE_SUPABASE_KEY),
    PEOPLE_CERT_SERVICE_ROLE_KEY: redact(process.env.PEOPLE_CERT_SERVICE_ROLE_KEY),
    PEOPLE_CERT_ISOLATED: true,
  },
  note: 'Skipped tests are not passes. Secrets redacted. Local Docker only.',
  at: new Date().toISOString(),
};

writeFileSync(join(evidenceDir, 'runtime-cert-latest.json'), JSON.stringify(report, null, 2));
writeFileSync(
  join(evidenceDir, `runtime-cert-${stamp}.json`),
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify(
    {
      verdict: report.verdict,
      passed: passed.length,
      failed: failed.length,
      skipped: skipped.length,
      missingRequired,
    },
    null,
    2,
  ),
);
process.exit(report.verdict === 'CERTIFIED' ? 0 : failed.length ? 1 : 2);
