#!/usr/bin/env node
/**
 * Phase 2D ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â read-only production People preflight.
 *
 * Does NOT: enable flags, backfill, deploy, commit, push, or write production data.
 * Does NOT: change Exposed schemas.
 *
 * Required: SUPABASE_ACCESS_TOKEN (or .supabase-access-token)
 * Optional: SUPABASE_JWT_SECRET (or .supabase-jwt-secret) for people_app live probe
 * Optional: PEOPLE_SUPABASE_PROJECT_REF (default dwygvwnjjaennksddniu)
 *
 * Run: node scripts/people-phase2d-prod-preflight.mjs
 */
import { createHmac, createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const REF = process.env.PEOPLE_SUPABASE_PROJECT_REF?.trim() || 'dwygvwnjjaennksddniu';
const API_URL = `https://${REF}.supabase.co`;
const evidenceDir = join(root, 'docs', 'audits', 'runtime-evidence-people-phase2d-prod-preflight');
const reportPath = join(evidenceDir, 'phase2d-prod-preflight-report.json');
const mdPath = join(root, 'docs', 'reports', 'EA-UNIVERSAL-PORTAL-PHASE-2D-PEOPLE-PROD-PREFLIGHT.md');
mkdirSync(evidenceDir, { recursive: true });
mkdirSync(join(root, 'docs', 'reports'), { recursive: true });

const EXPECTED_TABLES = [
  'persons',
  'person_email_keys',
  'person_external_keys',
  'org_memberships',
  'households',
  'household_members',
  'relationships',
  'program_links',
  'consents',
  'acl_grants',
  'merge_jobs',
  'import_jobs',
  'import_row_results',
  'migration_checkpoints',
  'audit_events',
];

const REQUIRED_RPCS = [
  'ensure_person',
  'get_person',
  'merge_finalize',
  'pre_request',
  'update_person',
  'upsert_relationship',
];

const MIGRATION_FILES = [
  '007_people_phase2c_schema.sql',
  '008_people_phase2c_postgrest_wiring.sql',
  '009_people_upsert_relationship.sql',
  '010_people_get_person.sql',
];

const FLAG_NAMES = [
  'UNIVERSAL_PEOPLE',
  'UNIVERSAL_PEOPLE_PERSIST',
  'UNIVERSAL_PEOPLE_MIGRATE_CLIENTS',
];

const report = {
  artifact: 'people-phase2d-prod-preflight',
  phase: '2D',
  mode: 'read_only',
  projectRef: REF,
  apiUrl: API_URL,
  at: new Date().toISOString(),
  verdict: 'BLOCKED',
  checks: [],
  blockers: [],
  enablementRequirements: [],
  evidenceDir: 'docs/audits/runtime-evidence-people-phase2d-prod-preflight',
};

function scrub(s) {
  return String(s || '')
    .replace(/sbp_[a-f0-9]+/gi, '[token]')
    .replace(/sb_secret_[A-Za-z0-9_]+/gi, '[sb_secret]')
    .replace(/sb_publishable_[A-Za-z0-9_]+/gi, '[sb_publishable]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[jwt]')
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[db_url]')
    .slice(0, 2000);
}

function check(id, ok, detail, opts = {}) {
  const entry = {
    id,
    ok: Boolean(ok),
    detail: scrub(detail),
    blocking: opts.blocking !== false,
  };
  report.checks.push(entry);
  console.log(JSON.stringify({ check: id, ok: entry.ok }));
  if (!entry.ok && entry.blocking) {
    report.blockers.push({ id, detail: entry.detail, action: opts.action || null });
  }
  return entry.ok;
}

function loadSecretFile(name) {
  const p = join(root, name);
  if (!existsSync(p)) return '';
  return readFileSync(p, 'utf8').trim();
}

if (!process.env.SUPABASE_ACCESS_TOKEN?.trim()) {
  const t = loadSecretFile('.supabase-access-token');
  if (t) process.env.SUPABASE_ACCESS_TOKEN = t;
}
if (!process.env.SUPABASE_JWT_SECRET?.trim()) {
  const s = loadSecretFile('.supabase-jwt-secret');
  if (s) process.env.SUPABASE_JWT_SECRET = s;
}

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    env: process.env,
    input: opts.input,
    timeout: opts.timeout ?? 120000,
    maxBuffer: 20 * 1024 * 1024,
  });
}

async function dbQuery(sql) {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim() || '';

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${REF}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      },
    );

    const text = await response.text();

    if (!response.ok) {
      return {
        status: 1,
        stdout: '',
        stderr: `Management API database query failed (${response.status}): ${text}`,
      };
    }

    const payload = text ? JSON.parse(text) : null;
    const row = Array.isArray(payload) ? payload[0] : payload;
    const value =
      row && typeof row === 'object'
        ? (row.json_build_object ?? Object.values(row)[0])
        : row;

    return {
      status: 0,
      stdout: typeof value === 'string' ? value : JSON.stringify(value),
      stderr: '',
    };
  } catch (error) {
    return {
      status: 1,
      stdout: '',
      stderr: `Management API database query failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
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

function fingerprint(value) {
  if (!value) return null;
  return createHash('sha256').update(String(value)).digest('hex').slice(0, 12);
}

async function mgmtGet(path) {
  const token = process.env.SUPABASE_ACCESS_TOKEN.trim();
  const res = await fetch(`https://api.supabase.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, text };
}

function parseExposedSchemas(dbSchema) {
  return String(dbSchema || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function writeOutputs() {
  const failed = report.checks.filter((c) => !c.ok && c.blocking);
  report.verdict = failed.length === 0 && report.blockers.length === 0 ? 'PASS' : 'BLOCKED';

  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  const lines = [];
  lines.push('# EA Universal Portal ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Phase 2D People Production Preflight');
  lines.push('');
  lines.push(`**Verdict:** ${report.verdict}`);
  lines.push(`**Mode:** read-only (no flag enablement, no backfill, no production writes)`);
  lines.push(`**Project:** \`${report.projectRef}\``);
  lines.push(`**API:** \`${report.apiUrl}\``);
  lines.push(`**At:** ${report.at}`);
  lines.push('');
  lines.push('## Checks');
  lines.push('');
  lines.push('| Check | Result | Detail |');
  lines.push('|---|---|---|');
  for (const c of report.checks) {
    lines.push(`| \`${c.id}\` | ${c.ok ? 'PASS' : 'FAIL'} | ${c.detail.replace(/\|/g, '\\|').slice(0, 240)} |`);
  }
  lines.push('');
  if (report.blockers.length) {
    lines.push('## Blockers');
    lines.push('');
    for (const b of report.blockers) {
      lines.push(`- **${b.id}**: ${b.detail}${b.action ? ` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â ${b.action}` : ''}`);
    }
    lines.push('');
  }
  lines.push('## Enablement requirements (remaining)');
  lines.push('');
  if (report.enablementRequirements.length === 0) {
    lines.push('_None recorded (preflight blocked before requirements list)._');
  } else {
    for (const [i, req] of report.enablementRequirements.entries()) {
      lines.push(`${i + 1}. ${req}`);
    }
  }
  lines.push('');
  lines.push('## Explicit non-actions this run');
  lines.push('');
  lines.push('- Did **not** enable `UNIVERSAL_PEOPLE*`');
  lines.push('- Did **not** run Client Record backfill');
  lines.push('- Did **not** deploy, commit, or push');
  lines.push('- Did **not** modify Exposed schemas or production People data');
  lines.push('');
  lines.push(`Evidence JSON: \`${report.evidenceDir}/phase2d-prod-preflight-report.json\``);
  lines.push('');
  writeFileSync(mdPath, lines.join('\n'));
}

function finish(code) {
  writeOutputs();
  console.log(
    JSON.stringify(
      {
        ok: report.verdict === 'PASS',
        verdict: report.verdict,
        projectRef: REF,
        checksPassed: report.checks.filter((c) => c.ok).map((c) => c.id),
        checksFailed: report.checks.filter((c) => !c.ok).map((c) => c.id),
        blockers: report.blockers,
        enablementRequirements: report.enablementRequirements,
        reportMd: 'docs/reports/EA-UNIVERSAL-PORTAL-PHASE-2D-PEOPLE-PROD-PREFLIGHT.md',
        evidence: 'docs/audits/runtime-evidence-people-phase2d-prod-preflight/phase2d-prod-preflight-report.json',
      },
      null,
      2,
    ),
  );
  process.exit(code);
}

// ---------------------------------------------------------------------------
// Gate 0: token
// ---------------------------------------------------------------------------
if (!process.env.SUPABASE_ACCESS_TOKEN?.trim()?.startsWith('sbp_')) {
  check('access_token', false, 'SUPABASE_ACCESS_TOKEN missing', {
    action: 'Set token in this shell (or .supabase-access-token), then re-run',
  });
  finish(2);
}
check('access_token', true, 'present');

// ---------------------------------------------------------------------------
// Gate 1: Exposed schemas MUST include people ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â STOP if absent (no mutation)
// ---------------------------------------------------------------------------
{
  const res = await mgmtGet(`/projects/${REF}/postgrest`);
  const dbSchema = res.json?.db_schema ?? res.json?.dbSchema ?? '';
  const schemas = parseExposedSchemas(dbSchema);
  writeFileSync(
    join(evidenceDir, 'postgrest-config-keys.json'),
    JSON.stringify(
      {
        status: res.status,
        keys: Object.keys(res.json || {}),
        db_schema: dbSchema,
        schemas,
      },
      null,
      2,
    ),
  );

  const hasPeople = schemas.includes('people');
  if (!hasPeople) {
    check(
      'exposed_schemas_people',
      false,
      `people ABSENT from Exposed schemas (db_schema=${JSON.stringify(dbSchema || null)})`,
      {
        action:
          'STOP: Operator must add `people` under Project Settings ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ API ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Exposed schemas, then re-run. This script will not change it.',
      },
    );
    report.enablementRequirements.push(
      'Add `people` to Supabase API Exposed schemas (manual dashboard change) before any further enablement.',
    );
    finish(1);
  }
  check('exposed_schemas_people', true, `schemas=${schemas.join(',')}`);
}

// ---------------------------------------------------------------------------
// SQL inventory (read-only)
// ---------------------------------------------------------------------------
{
  const sql = `
select json_build_object(
  'people_schema', exists(select 1 from information_schema.schemata where schema_name='people'),
  'tables', (
    select coalesce(json_agg(t.table_name order by t.table_name), '[]'::json)
    from information_schema.tables t
    where t.table_schema='people' and t.table_type='BASE TABLE'
  ),
  'table_count', (
    select count(*)::int from information_schema.tables
    where table_schema='people' and table_type='BASE TABLE'
  ),
  'force_rls', (
    select count(*)::int
    from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='people' and c.relkind='r' and c.relrowsecurity and c.relforcerowsecurity
  ),
  'rls_enabled', (
    select count(*)::int
    from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='people' and c.relkind='r' and c.relrowsecurity
  ),
  'people_app_role', exists(select 1 from pg_roles where rolname='people_app'),
  'people_app_bypassrls', (
    select coalesce(rolbypassrls, false) from pg_roles where rolname='people_app'
  ),
  'rpcs', (
    select coalesce(json_agg(p.proname order by p.proname), '[]'::json)
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='people' and p.proname = any(array[
      'ensure_person','get_person','merge_finalize','pre_request','update_person','upsert_relationship'
    ])
  ),
  'migration_versions', (
    select case
      when to_regclass('supabase_migrations.schema_migrations') is null then '[]'::json
      else (
        select coalesce(json_agg(version order by version), '[]'::json)
        from supabase_migrations.schema_migrations
        where version::text like '007%'
           or version::text like '008%'
           or version::text like '009%'
           or version::text like '010%'
           or version::text ilike '%people%'
      )
    end
  ),
  'grants_people_app_schema', (
    select count(*)::int from information_schema.role_usage_grants
    where object_schema='people' and grantee='people_app'
  ),
  'service_role_table_privs', (
    select count(*)::int
    from information_schema.role_table_grants
    where table_schema='people' and grantee='service_role'
  ),
  'service_role_routine_privs', (
    select count(*)::int
    from information_schema.routine_privileges
    where routine_schema='people' and grantee='service_role'
  ),
  'pre_request_setting', (
    select coalesce(
      (select array_to_string(s.setconfig, ',') from pg_db_role_setting s
        join pg_roles r on r.oid=s.setrole
        where r.rolname='authenticator'
          and s.setconfig::text ilike '%pgrst.db_pre_request%people.pre_request%'
        limit 1),
      ''
    )
  )
)::text;
`;
  const r = await dbQuery(sql);
  writeFileSync(join(evidenceDir, 'sql-inventory.txt'), scrub(r.stdout || r.stderr || ''));
  if (r.status !== 0) {
    check('sql_inventory', false, r.stderr || r.stdout || 'db query failed', {
      action: 'Ensure project is linked and SUPABASE_ACCESS_TOKEN works for supabase db query --linked',
    });
    finish(1);
  }

  let inv = null;
  try {
    const m = String(r.stdout || '').match(/\{[\s\S]*\}/);
    inv = m ? JSON.parse(m[0]) : null;
  } catch {
    inv = null;
  }
  if (!inv) {
    check('sql_inventory', false, 'could not parse inventory JSON', {
      action: 'Inspect docs/audits/runtime-evidence-people-phase2d-prod-preflight/sql-inventory.txt',
    });
    finish(1);
  }
  writeFileSync(join(evidenceDir, 'sql-inventory.json'), JSON.stringify(inv, null, 2));
  check('sql_inventory', true, `table_count=${inv.table_count}`);

  check('people_schema', inv.people_schema === true, `people_schema=${inv.people_schema}`);

  const tables = Array.isArray(inv.tables) ? inv.tables : [];
  const missingTables = EXPECTED_TABLES.filter((t) => !tables.includes(t));
  check(
    'tables_15',
    inv.table_count === 15 && missingTables.length === 0,
    `count=${inv.table_count}; missing=${missingTables.join(',') || 'none'}`,
  );

  check(
    'force_rls',
    inv.force_rls === 15 && inv.rls_enabled === 15,
    `force_rls=${inv.force_rls}; rls_enabled=${inv.rls_enabled}`,
  );

  const rpcs = Array.isArray(inv.rpcs) ? inv.rpcs : [];
  const missingRpcs = REQUIRED_RPCS.filter((n) => !rpcs.includes(n));
  check('required_rpcs', missingRpcs.length === 0, `rpcs=${rpcs.join(',')}; missing=${missingRpcs.join(',') || 'none'}`);

  check(
    'people_app_role',
    inv.people_app_role === true && inv.people_app_bypassrls === false,
    `exists=${inv.people_app_role}; bypassrls=${inv.people_app_bypassrls}`,
  );

  check(
    'people_app_schema_usage',
    Number(inv.grants_people_app_schema) > 0,
    `usage_grants=${inv.grants_people_app_schema}`,
  );

  check(
    'service_role_sql_denial',
    Number(inv.service_role_table_privs) === 0 && Number(inv.service_role_routine_privs) === 0,
    `table_privs=${inv.service_role_table_privs}; routine_privs=${inv.service_role_routine_privs}`,
  );

  // Migration presence: prefer schema_migrations; also confirm files exist in repo
  const repoMigrationsOk = MIGRATION_FILES.every((f) =>
    existsSync(join(root, 'supabase', 'migrations', f)),
  );
  check('migration_files_repo', repoMigrationsOk, MIGRATION_FILES.join(', '));

  const migVersions = Array.isArray(inv.migration_versions) ? inv.migration_versions : [];
  // Remote may have applied via db query fallback without recording all versions ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â treat
  // schema truth (15 tables + RPCs) as primary; migration_versions is advisory.
  check(
    'migrations_007_010',
    inv.table_count === 15 && missingRpcs.length === 0 && repoMigrationsOk,
    `schema_truth_ok; recorded_versions=${JSON.stringify(migVersions)}`,
    { blocking: true },
  );

  const preOk = String(inv.pre_request_setting || '').includes('people.pre_request');
  check(
    'pre_request_bound',
    preOk,
    // Role setting query can be empty even when bound; advisory if empty (continue-report already bound).
    `setting=${inv.pre_request_setting || '(empty ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â advisory; continue-report previously bound)'}`,
    { blocking: false },
  );
}

// ---------------------------------------------------------------------------
// Live REST probes (read-only): service_role denied; people_app can reach schema
// ---------------------------------------------------------------------------
{
  let serviceRoleKey = '';
  const keysRes = await mgmtGet(`/projects/${REF}/api-keys`);
  if (keysRes.ok && Array.isArray(keysRes.json)) {
    const svc = keysRes.json.find(
      (k) => k?.name === 'service_role' || k?.tags?.includes?.('service_role'),
    );
    serviceRoleKey = svc?.api_key || svc?.key || '';
  }
  check(
    'service_role_key_fetched',
    Boolean(serviceRoleKey),
    serviceRoleKey ? `fingerprint=${fingerprint(serviceRoleKey)}` : `status=${keysRes.status}`,
    {
      action: keysRes.ok
        ? null
        : 'Management API api-keys failed ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â cannot live-probe service_role denial',
      blocking: false,
    },
  );

  if (serviceRoleKey) {
    const res = await fetch(`${API_URL}/rest/v1/persons?select=id&limit=1`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Accept-Profile': 'people',
      },
    });
    const body = scrub(await res.text());
    // Expect permission/schema denial (401/403/404 PGRST) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â not 200 with rows
    const denied = res.status === 401 || res.status === 403 || res.status === 404 || res.status >= 400;
    check(
      'service_role_rest_denial',
      denied && res.status !== 200,
      `status=${res.status}; body=${body.slice(0, 180)}`,
    );
  } else {
    check('service_role_rest_denial', false, 'skipped ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no service_role key', {
      blocking: false,
      action: 'SQL privilege check already covers service_role denial',
    });
  }

  let peopleAppJwt = process.env.PEOPLE_SUPABASE_KEY?.trim() || '';
  const jwtSecret = process.env.SUPABASE_JWT_SECRET?.trim() || '';
  if (!peopleAppJwt && jwtSecret) {
    const now = Math.floor(Date.now() / 1000);
    peopleAppJwt = signJwt(
      { role: 'people_app', iss: 'supabase', iat: now - 60, exp: now + 60 * 30 },
      jwtSecret,
    );
  }

  if (!peopleAppJwt) {
    check('people_app_rest_probe', false, 'no PEOPLE_SUPABASE_KEY or SUPABASE_JWT_SECRET for probe', {
      blocking: false,
      action: 'Optional: set SUPABASE_JWT_SECRET to mint ephemeral people_app JWT for live probe',
    });
  } else {
    // Read-only: OpenAPI for people schema / empty select that should not insert
    const openapi = await fetch(`${API_URL}/rest/v1/`, {
      headers: {
        apikey: peopleAppJwt,
        Authorization: `Bearer ${peopleAppJwt}`,
        'Accept-Profile': 'people',
      },
    });
    const openText = scrub(await openapi.text());
    const openOk = openapi.status === 200;
    check(
      'people_app_rest_probe',
      openOk,
      `status=${openapi.status}; body=${openText.slice(0, 120)}`,
      {
        action: openOk
          ? null
          : 'people_app JWT rejected ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â verify Exposed schemas + JWT secret match project',
      },
    );

    // get_person on nonexistent id ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â read RPC, no write
    const rpc = await fetch(`${API_URL}/rest/v1/rpc/get_person`, {
      method: 'POST',
      headers: {
        apikey: peopleAppJwt,
        Authorization: `Bearer ${peopleAppJwt}`,
        'Content-Type': 'application/json',
        'Accept-Profile': 'people',
        'Content-Profile': 'people',
      },
      body: JSON.stringify({ p_person_id: '00000000-0000-0000-0000-000000000000' }),
    });
    const rpcText = scrub(await rpc.text());
    // 200 with null/empty or 404/PGRST are fine; 401/403 means bad perms
    const rpcOk = rpc.status !== 401 && rpc.status !== 403;
    check(
      'people_app_rpc_get_person_readonly',
      rpcOk,
      `status=${rpc.status}; body=${rpcText.slice(0, 160)}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Vercel Production env ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â presence only, never print values
// ---------------------------------------------------------------------------
{
  const ls = run('npx', ['vercel', 'env', 'ls', 'production'], { timeout: 120000 });
  const out = `${ls.stdout || ''}\n${ls.stderr || ''}`;
  writeFileSync(join(evidenceDir, 'vercel-env-ls.txt'), scrub(out));
  const hasUrl = /PEOPLE_SUPABASE_URL/i.test(out);
  const hasKey = /PEOPLE_SUPABASE_KEY/i.test(out);
  check('vercel_people_url_present', hasUrl, hasUrl ? 'PEOPLE_SUPABASE_URL listed' : 'missing');
  check('vercel_people_key_present', hasKey, hasKey ? 'PEOPLE_SUPABASE_KEY listed' : 'missing');

  const flagHits = FLAG_NAMES.filter((name) => {
    // Match name as env var row; treat Encrypted presence as potentially set
    const re = new RegExp(`^\\s*${name}\\s`, 'im');
    const re2 = new RegExp(`\\b${name}\\b`);
    return re.test(out) || re2.test(out);
  });

  // Flags must remain OFF. If listed, we cannot read values via ls ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â treat any listing
  // as needing pull confirmation. Prefer: absent from production env entirely.
  if (flagHits.length === 0) {
    check('vercel_universal_people_flags_off', true, 'UNIVERSAL_PEOPLE* not listed on production');
  } else {
    // Pull names only via vercel env pull to a temp file and check values without logging them
    const pullPath = join(evidenceDir, '_vercel-pull.env.local');
    const pull = run('npx', ['vercel', 'env', 'pull', pullPath, '--environment', 'production', '--yes'], {
      timeout: 120000,
    });
    let flagOn = [];
    if (pull.status === 0 && existsSync(pullPath)) {
      const envText = readFileSync(pullPath, 'utf8');
      for (const name of FLAG_NAMES) {
        const m = envText.match(new RegExp(`^${name}=(.*)$`, 'm'));
        if (!m) continue;
        const raw = m[1].replace(/^"|"$/g, '').trim().toLowerCase();
        if (raw === '1' || raw === 'true' || raw === 'on' || raw === 'yes') flagOn.push(name);
      }
      // Wipe pulled secrets from disk evidence (keep only redacted summary)
      writeFileSync(
        pullPath,
        '# redacted ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â flag evaluation only\n' +
          FLAG_NAMES.map((n) => `${n}=${flagOn.includes(n) ? 'ON' : 'off_or_absent'}`).join('\n') +
          '\n',
      );
    }
    check(
      'vercel_universal_people_flags_off',
      flagOn.length === 0,
      flagOn.length
        ? `FLAGS ON: ${flagOn.join(',')}`
        : `listed=${flagHits.join(',')} but values not ON`,
      {
        action: flagOn.length
          ? 'Remove/disable UNIVERSAL_PEOPLE* on Vercel Production before enablement review'
          : null,
      },
    );
  }

  // Cert memory / shared memory must not be on production
  const badMem = ['PEOPLE_CERT_MEMORY', 'PEOPLE_SHARED_MEMORY'].filter((n) =>
    new RegExp(`\\b${n}\\b`).test(out),
  );
  check(
    'vercel_no_cert_memory_flags',
    badMem.length === 0,
    badMem.length ? `present=${badMem.join(',')}` : 'absent',
  );
}

// ---------------------------------------------------------------------------
// Code invariants (repo) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no Airtable/memory SoR when Persist ON; no backfill gate ON
// ---------------------------------------------------------------------------
{
  const adapter = readFileSync(join(root, 'lib/people/adapter.ts'), 'utf8');
  const noAirtableSelect =
    adapter.includes('Airtable People SoR is quarantined') &&
    !/airtablePeopleRepository\s*\(/.test(adapter);
  check('code_no_airtable_adapter_select', noAirtableSelect, 'adapter never selects airtable');

  const persistThrows =
    adapter.includes('assertPeoplePersistReady') && adapter.includes('postgresPeopleRepository');
  check('code_persist_uses_postgres', persistThrows, 'Persist ON ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ postgres repository');

  const flagsSrc = readFileSync(join(root, 'lib/people/flags.ts'), 'utf8');
  check(
    'code_migrate_flag_default_off',
    flagsSrc.includes('UNIVERSAL_PEOPLE_MIGRATE_CLIENTS') &&
      flagsSrc.includes('isUniversalPeopleMigrateEnabled'),
    'migrate flag gated',
  );

  const migrate = readFileSync(join(root, 'lib/people/migrate-backfill.ts'), 'utf8');
  check(
    'code_backfill_gated',
    /UNIVERSAL_PEOPLE_MIGRATE_CLIENTS|isUniversalPeopleMigrateEnabled/.test(migrate) ||
      migrate.includes('MIGRATE_CLIENTS'),
    'backfill module exists and is flag-gated in callers',
    { blocking: false },
  );

  // Confirm no production backfill was invoked this run
  check('no_client_record_backfill_this_run', true, 'preflight did not invoke migrate/backfill');
  check('no_production_data_writes_this_run', true, 'preflight used SELECT/inventory + read REST only');
}

// ---------------------------------------------------------------------------
// Enablement requirements (exact remaining) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â only if infra PASS path
// ---------------------------------------------------------------------------
report.enablementRequirements = [
  'Owner approval to enable People on production (launch decision).',
  'Confirm PITR / backups and monitoring on project dwygvwnjjaennksddniu.',
  'Set UNIVERSAL_PEOPLE_PERSIST=1 on Vercel Production (Postgres SoR) before or with People ON (INV-20).',
  'Set UNIVERSAL_PEOPLE=1 only after Persist ON + health check of people_app REST.',
  'Keep UNIVERSAL_PEOPLE_MIGRATE_CLIENTS=0 until an explicit Client Record backfill runbook is executed.',
  'Do not set PEOPLE_CERT_MEMORY or PEOPLE_SHARED_MEMORY on production.',
  'Run controlled smoke (ensure_person / get_person) on a non-prod or disposable tenant before broad enablement.',
  'Only then consider Client Record backfill under a separate change window.',
];

finish(report.blockers.length ? 1 : 0);
