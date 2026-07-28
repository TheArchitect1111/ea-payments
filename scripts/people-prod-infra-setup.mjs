#!/usr/bin/env node
/**
 * Phase 2C People production infra — run where SUPABASE_ACCESS_TOKEN is set.
 *
 * Required:
 *   SUPABASE_ACCESS_TOKEN
 *   SUPABASE_DB_PASSWORD   (Project Settings → Database)
 * Optional:
 *   PEOPLE_SUPABASE_PROJECT_REF (default dwygvwnjjaennksddniu)
 *   SUPABASE_JWT_SECRET    (if auth config API cannot return jwt secret)
 *
 * Never enables UNIVERSAL_PEOPLE*. Never prints secrets.
 */
import { createHmac } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const REF = process.env.PEOPLE_SUPABASE_PROJECT_REF?.trim() || 'dwygvwnjjaennksddniu';
const API_URL = `https://${REF}.supabase.co`;
const evidenceDir = join(root, 'docs', 'audits', 'runtime-evidence-people-phase2c-prod-infra');
mkdirSync(evidenceDir, { recursive: true });

const report = {
  artifact: 'people-phase2c-prod-infra-setup',
  projectRef: REF,
  at: new Date().toISOString(),
  steps: [],
  blockers: [],
  flagsRemainOff: true,
};

function scrub(text) {
  return String(text || '')
    .replace(/sbp_[a-f0-9]+/gi, '[sbp_token]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[jwt]')
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[db_url]')
    .slice(0, 1500);
}

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env },
    input: opts.input,
    timeout: opts.timeout ?? 180_000,
    maxBuffer: 10 * 1024 * 1024,
  });
}

function step(id, ok, detail) {
  report.steps.push({ id, ok: Boolean(ok), detail: scrub(detail) });
  console.log(JSON.stringify({ step: id, ok: Boolean(ok) }));
}

function b64urlJson(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload, secret) {
  const h = b64urlJson({ alg: 'HS256', typ: 'JWT' });
  const p = b64urlJson(payload);
  const data = `${h}.${p}`;
  const sig = createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${sig}`;
}

function finish(code) {
  writeFileSync(join(evidenceDir, 'setup-report.json'), JSON.stringify(report, null, 2));
  const failed = report.steps.filter((s) => !s.ok);
  console.log(
    JSON.stringify(
      {
        ok: code === 0,
        projectRef: REF,
        apiUrlHost: `${REF}.supabase.co`,
        stepsOk: report.steps.filter((s) => s.ok).map((s) => s.id),
        stepsFailed: failed.map((s) => s.id),
        blockers: report.blockers,
        evidence: 'docs/audits/runtime-evidence-people-phase2c-prod-infra/setup-report.json',
        note: 'People flags remain OFF. Secrets not printed.',
      },
      null,
      2,
    ),
  );
  process.exit(code);
}

if (!process.env.SUPABASE_ACCESS_TOKEN?.trim() && existsSync(join(root, '.supabase-access-token'))) {
  process.env.SUPABASE_ACCESS_TOKEN = readFileSync(join(root, '.supabase-access-token'), 'utf8').trim();
}

if (!process.env.SUPABASE_ACCESS_TOKEN?.trim()) {
  report.blockers.push({
    id: 'SUPABASE_ACCESS_TOKEN',
    action: 'Set $env:SUPABASE_ACCESS_TOKEN = "sbp_..." in this shell, then re-run',
  });
  finish(2);
}

if (!process.env.SUPABASE_DB_PASSWORD?.trim()) {
  // Fail fast — do not hang on interactive link password prompt
  report.blockers.push({
    id: 'SUPABASE_DB_PASSWORD',
    action:
      'Set $env:SUPABASE_DB_PASSWORD to the database password, then re-run the script',
    link: `https://supabase.com/dashboard/project/${REF}/settings/database`,
    clickPath: 'Project Settings → Database → Database password (reset/copy)',
  });
  step('token_present', true, 'ok');
  step('db_password', false, 'missing — refusing to hang on interactive prompt');
  finish(2);
}

step('token_present', true, 'ok');
step('db_password', true, 'present');

{
  const r = run('npx', ['supabase', 'projects', 'list', '-o', 'json'], { timeout: 60_000 });
  const ok = r.status === 0 && (r.stdout || '').includes(REF);
  step('projects_list', ok, r.stdout || r.stderr);
  if (!ok) {
    report.blockers.push({ id: 'projects_list', action: 'Token cannot see project; regenerate sbp token' });
    finish(1);
  }
}

{
  const r = run(
    'npx',
    [
      'supabase',
      'link',
      '--project-ref',
      REF,
      '--password',
      process.env.SUPABASE_DB_PASSWORD.trim(),
      '--yes',
    ],
    { timeout: 120_000 },
  );
  const combined = `${r.stdout || ''}\n${r.stderr || ''}`;
  const ok =
    r.status === 0 ||
    /already linked|Finished supabase link|Project linked/i.test(combined);
  step('link', ok, combined);
  if (!ok) {
    report.blockers.push({
      id: 'link',
      action: 'Link failed — confirm DB password, then re-run',
      link: `https://supabase.com/dashboard/project/${REF}/settings/database`,
    });
    finish(1);
  }
}

{
  const r = run('npx', ['supabase', 'db', 'push', '--include-all', '--yes'], {
    timeout: 300_000,
  });
  const combined = `${r.stdout || ''}\n${r.stderr || ''}`;
  const ok =
    r.status === 0 ||
    /Remote database is up to date|Finished supabase db push|applied/i.test(combined);
  step('db_push', ok, combined);
  if (!ok) {
    report.blockers.push({ id: 'db_push', action: 'db push failed — see setup-report detail' });
    finish(1);
  }
}

const verifySql = `
select json_build_object(
  'people_schema', exists(select 1 from information_schema.schemata where schema_name='people'),
  'table_count', (select count(*)::int from information_schema.tables where table_schema='people' and table_type='BASE TABLE'),
  'force_rls', (select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='people' and c.relkind='r' and c.relrowsecurity and c.relforcerowsecurity),
  'people_app_role', exists(select 1 from pg_roles where rolname='people_app'),
  'rpcs', (select coalesce(json_agg(p.proname order by p.proname), '[]'::json) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='people' and p.proname in ('ensure_person','merge_finalize','update_person','upsert_relationship','get_person','pre_request')),
  'pre_request_bound', exists(
    select 1 from pg_db_role_setting s join pg_roles r on r.oid=s.setrole
    where r.rolname='authenticator'
      and exists (select 1 from unnest(s.setconfig) cfg where cfg like 'pgrst.db_pre_request=%people.pre_request%')
  )
)::text;
`;

{
  let r = run('npx', ['supabase', 'db', 'query', verifySql, '--linked'], { timeout: 120_000 });
  if (r.status !== 0) {
    r = run('npx', ['supabase', 'db', 'query', verifySql], { timeout: 120_000 });
  }
  step('sql_verify', r.status === 0, r.stdout || r.stderr);
  writeFileSync(join(evidenceDir, 'sql-verify-redacted.txt'), scrub(r.stdout || r.stderr));
}

{
  const sql = `alter role authenticator set pgrst.db_pre_request = 'people.pre_request'; notify pgrst, 'reload config'; notify pgrst, 'reload schema';`;
  let r = run('npx', ['supabase', 'db', 'query', sql, '--linked'], { timeout: 60_000 });
  if (r.status !== 0) r = run('npx', ['supabase', 'db', 'query', sql], { timeout: 60_000 });
  step('pre_request_bind', r.status === 0, r.stdout || r.stderr);
}

// Expose people schema on API (best-effort via management API / SQL comment retained in migration docs)
{
  const sql = `comment on schema people is 'EA People SoR — ensure exposed in API settings';`;
  run('npx', ['supabase', 'db', 'query', sql, '--linked'], { timeout: 30_000 });
  step(
    'schema_expose_note',
    true,
    `Confirm API schemas include people: https://supabase.com/dashboard/project/${REF}/settings/api`,
  );
}

let peopleAppJwt = null;
{
  const token = process.env.SUPABASE_ACCESS_TOKEN.trim();
  let jwtSecret = process.env.SUPABASE_JWT_SECRET?.trim() || '';

  if (!jwtSecret) {
    try {
      const authCfg = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      step('auth_config_fetch', authCfg.ok, `status=${authCfg.status}`);
      if (authCfg.ok) {
        const authJson = await authCfg.json();
        jwtSecret =
          authJson?.jwt_secret ||
          authJson?.JWT_SECRET ||
          authJson?.jwtSecret ||
          '';
      }
    } catch (e) {
      step('auth_config_fetch', false, e instanceof Error ? e.message : String(e));
    }
  } else {
    step('auth_config_fetch', true, 'SUPABASE_JWT_SECRET provided in env');
  }

  if (!jwtSecret) {
    report.blockers.push({
      id: 'SUPABASE_JWT_SECRET',
      action:
        'Set $env:SUPABASE_JWT_SECRET from Dashboard → Project Settings → API → JWT Secret, then re-run',
      link: `https://supabase.com/dashboard/project/${REF}/settings/api`,
    });
    step('mint_people_app_jwt', false, 'jwt secret unavailable');
  } else {
    const now = Math.floor(Date.now() / 1000);
    peopleAppJwt = signJwt(
      {
        role: 'people_app',
        iss: 'supabase',
        iat: now - 60,
        exp: now + 60 * 60 * 24 * 365,
      },
      jwtSecret,
    );
    step('mint_people_app_jwt', true, 'minted');
  }
}

function vercelEnvUpsert(name, value) {
  run('npx', ['vercel', 'env', 'rm', name, 'production', '--yes'], { timeout: 60_000 });
  const add = run('npx', ['vercel', 'env', 'add', name, 'production'], {
    input: `${value}\n`,
    timeout: 60_000,
  });
  return add.status === 0;
}

if (peopleAppJwt) {
  step('vercel_PEOPLE_SUPABASE_URL', vercelEnvUpsert('PEOPLE_SUPABASE_URL', API_URL), 'production');
  step(
    'vercel_PEOPLE_SUPABASE_KEY',
    vercelEnvUpsert('PEOPLE_SUPABASE_KEY', peopleAppJwt),
    'production people_app',
  );
  for (const flag of [
    'UNIVERSAL_PEOPLE',
    'UNIVERSAL_PEOPLE_PERSIST',
    'UNIVERSAL_PEOPLE_MIGRATE_CLIENTS',
  ]) {
    run('npx', ['vercel', 'env', 'rm', flag, 'production', '--yes'], { timeout: 60_000 });
  }
  step('vercel_flags_cleared', true, 'UNIVERSAL_PEOPLE* not enabled');
} else {
  step('vercel_env', false, 'skipped');
}

try {
  if (existsSync(join(root, '.supabase-access-token'))) unlinkSync(join(root, '.supabase-access-token'));
} catch {
  /* ignore */
}

const failed = report.steps.filter((s) => !s.ok);
finish(failed.length || report.blockers.length ? 1 : 0);
