#!/usr/bin/env node
/**
 * Phase 2D unblock — apply 011 grants, mint people_app JWT, set Vercel key.
 * Does NOT enable UNIVERSAL_PEOPLE*.
 *
 * Required:
 *   SUPABASE_ACCESS_TOKEN (or .supabase-access-token)
 * Optional:
 *   SUPABASE_JWT_SECRET (or .supabase-jwt-secret) — else fetch from Management API
 *   PEOPLE_SUPABASE_PROJECT_REF (default dwygvwnjjaennksddniu)
 *
 * Run: node scripts/people-phase2d-unblock.mjs
 */
import { createHmac, createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const REF = process.env.PEOPLE_SUPABASE_PROJECT_REF?.trim() || 'dwygvwnjjaennksddniu';
const API_URL = `https://${REF}.supabase.co`;
const evidenceDir = join(root, 'docs', 'audits', 'runtime-evidence-people-phase2d-prod-preflight');
mkdirSync(evidenceDir, { recursive: true });

const report = {
  artifact: 'people-phase2d-unblock',
  projectRef: REF,
  at: new Date().toISOString(),
  steps: [],
  blockers: [],
  flagsRemainOff: true,
};

function scrub(s) {
  return String(s || '')
    .replace(/sbp_[a-f0-9]+/gi, '[token]')
    .replace(/sb_secret_[A-Za-z0-9_]+/gi, '[sb_secret]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[jwt]')
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[db_url]')
    .slice(0, 1500);
}

function step(id, ok, detail) {
  report.steps.push({ id, ok: Boolean(ok), detail: scrub(detail) });
  console.log(JSON.stringify({ step: id, ok: Boolean(ok) }));
}

function loadToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN?.trim()?.startsWith('sbp_')) {
    return process.env.SUPABASE_ACCESS_TOKEN.trim();
  }
  const p = join(root, '.supabase-access-token');
  if (existsSync(p)) {
    const t = readFileSync(p, 'utf8').trim();
    if (t.startsWith('sbp_')) return t;
  }
  return '';
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
  return createHash('sha256').update(String(value)).digest('hex').slice(0, 12);
}

async function mgmt(path, init = {}) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const res = await fetch(`https://api.supabase.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
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

function vercelUpsert(name, value) {
  spawnSync('npx', ['vercel', 'env', 'rm', name, 'production', '--yes'], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    env: process.env,
    timeout: 90000,
  });
  const add = spawnSync('npx', ['vercel', 'env', 'add', name, 'production'], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    env: process.env,
    input: `${value}\n`,
    timeout: 90000,
  });
  return add.status === 0;
}

async function main() {
  const token = loadToken();
  if (!token) {
    report.blockers.push({
      id: 'SUPABASE_ACCESS_TOKEN',
      action:
        'Create a personal access token at https://supabase.com/dashboard/account/tokens then: $env:SUPABASE_ACCESS_TOKEN="sbp_..." ; node scripts/people-phase2d-unblock.mjs',
    });
    writeFileSync(join(evidenceDir, 'unblock-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ ok: false, blockers: report.blockers }, null, 2));
    process.exit(2);
  }
  process.env.SUPABASE_ACCESS_TOKEN = token;
  step('access_token', true, `fp=${fingerprint(token)}`);

  const sql = readFileSync(join(root, 'supabase/migrations/011_people_app_schema_grants.sql'), 'utf8');

  // Prefer Management API query (no DB password). Fall back to migrations endpoint.
  let applied = false;
  {
    const q = await mgmt(`/projects/${REF}/database/query`, {
      method: 'POST',
      body: JSON.stringify({ query: sql }),
    });
    if (q.ok) {
      applied = true;
      step('apply_011_query', true, `status=${q.status}`);
    } else {
      step('apply_011_query', false, `status=${q.status}; body=${scrub(q.text).slice(0, 200)}`);
      const m = await mgmt(`/projects/${REF}/database/migrations`, {
        method: 'POST',
        body: JSON.stringify({
          name: '011_people_app_schema_grants',
          query: sql,
        }),
      });
      if (m.ok || m.status === 201) {
        applied = true;
        step('apply_011_migration', true, `status=${m.status}`);
      } else {
        step('apply_011_migration', false, `status=${m.status}; body=${scrub(m.text).slice(0, 200)}`);
      }
    }
  }

  if (!applied) {
    report.blockers.push({
      id: 'apply_011',
      action:
        'Management API could not apply SQL. Set SUPABASE_DB_PASSWORD and run: node scripts/apply-people-migrations-remote.mjs',
      link: `https://supabase.com/dashboard/project/${REF}/sql/new`,
    });
  }

  // Verify USAGE grants
  {
    const verify = await mgmt(`/projects/${REF}/database/query`, {
      method: 'POST',
      body: JSON.stringify({
        query: `select count(*)::int as usage_grants
                from information_schema.role_usage_grants
                where object_schema='people' and grantee='people_app'`,
      }),
    });
    const count =
      verify.json?.[0]?.usage_grants ??
      verify.json?.usage_grants ??
      (Array.isArray(verify.json) ? verify.json[0]?.count : null);
    const n = Number(count);
    step('verify_usage_grants', Number.isFinite(n) && n > 0, `usage_grants=${count}; status=${verify.status}`);
    if (!(Number.isFinite(n) && n > 0)) {
      report.blockers.push({
        id: 'people_app_schema_usage',
        detail: `usage_grants=${count}`,
        action: 'Re-run 011 grants SQL in SQL editor if Management API blocked writes',
      });
    }
  }

  // Mint people_app JWT
  let jwtSecret =
    process.env.SUPABASE_JWT_SECRET?.trim() ||
    process.env.PEOPLE_SUPABASE_JWT_SECRET?.trim() ||
    (existsSync(join(root, '.supabase-jwt-secret'))
      ? readFileSync(join(root, '.supabase-jwt-secret'), 'utf8').trim()
      : '');

  if (!jwtSecret) {
    for (const path of [`/projects/${REF}/config/auth`, `/projects/${REF}/postgrest`]) {
      const res = await mgmt(path);
      step(`fetch_${path.split('/').pop()}`, res.ok, `status=${res.status}; keys=${Object.keys(res.json || {}).join(',')}`);
      if (!res.ok) continue;
      jwtSecret =
        res.json?.jwt_secret ||
        res.json?.JWT_SECRET ||
        res.json?.jwtSecret ||
        res.json?.secret ||
        '';
      if (jwtSecret) break;
    }
  } else {
    step('jwt_secret_source', true, 'env or file');
  }

  let peopleAppJwt = '';
  if (!jwtSecret) {
    report.blockers.push({
      id: 'SUPABASE_JWT_SECRET',
      link: `https://supabase.com/dashboard/project/${REF}/settings/api`,
      action: 'Copy JWT Secret → $env:SUPABASE_JWT_SECRET="..." → re-run',
    });
    step('mint_people_app_jwt', false, 'no jwt secret');
  } else {
    const now = Math.floor(Date.now() / 1000);
    peopleAppJwt = signJwt(
      { role: 'people_app', iss: 'supabase', iat: now - 60, exp: now + 60 * 60 * 24 * 365 },
      jwtSecret,
    );
    step('mint_people_app_jwt', true, `fp=${fingerprint(peopleAppJwt)}`);
  }

  if (peopleAppJwt) {
    step('vercel_url', vercelUpsert('PEOPLE_SUPABASE_URL', API_URL), API_URL);
    step('vercel_key', vercelUpsert('PEOPLE_SUPABASE_KEY', peopleAppJwt), 'people_app jwt');
    // Ensure flags stay off
    for (const f of [
      'UNIVERSAL_PEOPLE',
      'UNIVERSAL_PEOPLE_PERSIST',
      'UNIVERSAL_PEOPLE_MIGRATE_CLIENTS',
    ]) {
      spawnSync('npx', ['vercel', 'env', 'rm', f, 'production', '--yes'], {
        cwd: root,
        encoding: 'utf8',
        shell: true,
        env: process.env,
        timeout: 60000,
      });
    }
    step('flags_off', true, 'UNIVERSAL_PEOPLE* removed from production if present');

    // Live probe
    const openapi = await fetch(`${API_URL}/rest/v1/`, {
      headers: {
        apikey: peopleAppJwt,
        Authorization: `Bearer ${peopleAppJwt}`,
        'Accept-Profile': 'people',
      },
    });
    step('people_app_rest_probe', openapi.status === 200, `status=${openapi.status}`);
  }

  writeFileSync(join(evidenceDir, 'unblock-report.json'), JSON.stringify(report, null, 2));
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
        evidence: 'docs/audits/runtime-evidence-people-phase2d-prod-preflight/unblock-report.json',
        note: 'Flags remain OFF. Secrets not printed.',
      },
      null,
      2,
    ),
  );
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(scrub(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
