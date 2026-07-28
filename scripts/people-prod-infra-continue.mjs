#!/usr/bin/env node
/**
 * Continue after migrations 007–010 applied:
 * verify schema, bind pre_request, mint people_app JWT, set Vercel Production env.
 * Does NOT enable UNIVERSAL_PEOPLE*.
 *
 * Same shell as successful apply (token + preferably JWT secret or auth API access):
 *   node scripts/people-prod-infra-continue.mjs
 */
import { createHmac } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const REF = process.env.PEOPLE_SUPABASE_PROJECT_REF?.trim() || 'dwygvwnjjaennksddniu';
const API_URL = `https://${REF}.supabase.co`;
const evidenceDir = join(root, 'docs', 'audits', 'runtime-evidence-people-phase2c-prod-infra');
mkdirSync(evidenceDir, { recursive: true });

const report = {
  artifact: 'people-phase2c-prod-infra-continue',
  projectRef: REF,
  at: new Date().toISOString(),
  migrationsAppliedViaFallback: true,
  steps: [],
  blockers: [],
};

function scrub(s) {
  return String(s || '')
    .replace(/sbp_[a-f0-9]+/gi, '[token]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[jwt]')
    .slice(0, 1200);
}

function step(id, ok, detail) {
  report.steps.push({ id, ok: Boolean(ok), detail: scrub(detail) });
  console.log(JSON.stringify({ step: id, ok: Boolean(ok) }));
}

function run(args, opts = {}) {
  return spawnSync('npx', args, {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    env: process.env,
    input: opts.input,
    timeout: opts.timeout ?? 120000,
    maxBuffer: 20 * 1024 * 1024,
  });
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

function dbQuery(sql) {
  let r = run(['supabase', 'db', 'query', '--linked'], { input: sql, timeout: 120000 });
  if (r.status !== 0) {
    r = run(['supabase', 'db', 'query'], { input: sql, timeout: 120000 });
  }
  return r;
}

if (!process.env.SUPABASE_ACCESS_TOKEN?.trim()?.startsWith('sbp_')) {
  report.blockers.push({
    id: 'token',
    action: 'Set SUPABASE_ACCESS_TOKEN in this shell, then re-run',
  });
  console.log(JSON.stringify({ ok: false, blockers: report.blockers }, null, 2));
  process.exit(2);
}

// Verify
{
  const sql = `
select json_build_object(
  'people_schema', exists(select 1 from information_schema.schemata where schema_name='people'),
  'table_count', (select count(*)::int from information_schema.tables where table_schema='people' and table_type='BASE TABLE'),
  'force_rls', (select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='people' and c.relkind='r' and c.relrowsecurity and c.relforcerowsecurity),
  'people_app_role', exists(select 1 from pg_roles where rolname='people_app'),
  'rpcs', (select coalesce(json_agg(p.proname order by p.proname), '[]'::json)
           from pg_proc p join pg_namespace n on n.oid=p.pronamespace
           where n.nspname='people'
             and p.proname in ('ensure_person','merge_finalize','update_person','upsert_relationship','get_person','pre_request'))
)::text;
`;
  const r = dbQuery(sql);
  step('sql_verify', r.status === 0, r.stdout || r.stderr);
  writeFileSync(join(evidenceDir, 'continue-sql-verify.txt'), scrub(r.stdout || r.stderr));
}

// Bind pre_request
{
  const sql = `alter role authenticator set pgrst.db_pre_request = 'people.pre_request'; notify pgrst, 'reload config'; notify pgrst, 'reload schema';`;
  const r = dbQuery(sql);
  step('pre_request_bind', r.status === 0, r.stdout || r.stderr);
}

// Mint people_app JWT
let peopleAppJwt = null;
{
  let jwtSecret = process.env.SUPABASE_JWT_SECRET?.trim() || '';
  if (!jwtSecret) {
    const token = process.env.SUPABASE_ACCESS_TOKEN.trim();
    const urls = [
      `https://api.supabase.com/v1/projects/${REF}/postgrest`,
      `https://api.supabase.com/v1/projects/${REF}/config/auth`,
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        step('auth_config_fetch', res.ok, `${url.split('/').slice(-2).join('/')} status=${res.status}`);
        if (!res.ok) continue;
        const j = await res.json();
        jwtSecret =
          j?.jwt_secret ||
          j?.JWT_SECRET ||
          j?.jwtSecret ||
          j?.secret ||
          '';
        if (jwtSecret) break;
        // Log keys only (not values) to aid debugging without leaking secrets
        step('auth_config_keys', true, Object.keys(j || {}).join(','));
      } catch (e) {
        step('auth_config_fetch', false, e instanceof Error ? e.message : String(e));
      }
    }
  } else {
    step('auth_config_fetch', true, 'from SUPABASE_JWT_SECRET env');
  }

  if (!jwtSecret) {
    report.blockers.push({
      id: 'SUPABASE_JWT_SECRET',
      link: `https://supabase.com/dashboard/project/${REF}/settings/api`,
      action:
        'Copy JWT Secret → $env:SUPABASE_JWT_SECRET = "..." → re-run this script',
    });
    step('mint_people_app_jwt', false, 'no jwt secret');
  } else {
    const now = Math.floor(Date.now() / 1000);
    peopleAppJwt = signJwt(
      { role: 'people_app', iss: 'supabase', iat: now - 60, exp: now + 60 * 60 * 24 * 365 },
      jwtSecret,
    );
    step('mint_people_app_jwt', true, 'role=people_app');
  }
}

function vercelUpsert(name, value) {
  run(['vercel', 'env', 'rm', name, 'production', '--yes'], { timeout: 90000 });
  const add = run(['vercel', 'env', 'add', name, 'production'], {
    input: `${value}\n`,
    timeout: 90000,
  });
  return add.status === 0;
}

if (peopleAppJwt) {
  step('vercel_url', vercelUpsert('PEOPLE_SUPABASE_URL', API_URL), API_URL);
  step('vercel_key', vercelUpsert('PEOPLE_SUPABASE_KEY', peopleAppJwt), 'people_app jwt set');
  for (const f of [
    'UNIVERSAL_PEOPLE',
    'UNIVERSAL_PEOPLE_PERSIST',
    'UNIVERSAL_PEOPLE_MIGRATE_CLIENTS',
  ]) {
    run(['vercel', 'env', 'rm', f, 'production', '--yes'], { timeout: 60000 });
  }
  step('flags_off', true, 'UNIVERSAL_PEOPLE* not enabled on production');
} else {
  step('vercel', false, 'skipped');
}

// Operator reminder: expose people schema in API settings (cannot always set via SQL)
step(
  'expose_schema_reminder',
  true,
  `Confirm Exposed schemas includes people: https://supabase.com/dashboard/project/${REF}/settings/api`,
);

writeFileSync(join(evidenceDir, 'continue-report.json'), JSON.stringify(report, null, 2));
const failed = report.steps.filter((s) => !s.ok);
const ok = failed.length === 0 && report.blockers.length === 0;
console.log(
  JSON.stringify(
    {
      ok,
      projectRef: REF,
      stepsOk: report.steps.filter((s) => s.ok).map((s) => s.id),
      stepsFailed: failed.map((s) => s.id),
      blockers: report.blockers,
      evidence: 'docs/audits/runtime-evidence-people-phase2c-prod-infra/continue-report.json',
      note: 'Migrations already applied. Flags remain OFF.',
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
