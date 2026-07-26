#!/usr/bin/env node
/**
 * Orchestrate isolated local Supabase People Phase 2C certification.
 * - Starts local stack via npx supabase
 * - Mints people_app JWT from local JWT secret
 * - Runs runtime-cert-people-phase2c.mts with process-scoped env only
 * - Does NOT write secrets into .env.local
 *
 * Usage: node scripts/run-people-phase2c-local-cert.mjs
 */
import { createHmac } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const evidenceDir = join(root, 'docs', 'audits', 'runtime-evidence-people-phase2c');
mkdirSync(evidenceDir, { recursive: true });

function run(cmd, args, opts = {}) {
  console.log(`$ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...opts,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r;
}

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload, secret) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const sig = createHmac('sha256', secret).update(data).digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${sig}`;
}

function parseStatusEnv(stdout) {
  const map = {};
  for (const line of stdout.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) map[m[1]] = m[2].replace(/^"|"$/g, '');
  }
  return map;
}

// 1) Docker sanity
{
  const d = run('docker', ['info']);
  if (d.status !== 0) {
    console.error('Docker not running');
    process.exit(2);
  }
}

// 2) Start local supabase
{
  const start = run('npx', ['supabase', 'start'], {
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  if (start.status !== 0) {
    console.error('supabase start failed');
    process.exit(2);
  }
}

// 3) Status / secrets (kept in memory only)
const status = run('npx', ['supabase', 'status', '-o', 'env']);
if (status.status !== 0) {
  console.error('supabase status failed');
  process.exit(2);
}
const envMap = parseStatusEnv(status.stdout || '');
const apiUrl = envMap.API_URL || 'http://127.0.0.1:54321';
const jwtSecret = envMap.JWT_SECRET;
const serviceRole = envMap.SERVICE_ROLE_KEY;
const dbUrl =
  envMap.DB_URL ||
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

if (!jwtSecret || !serviceRole) {
  console.error('Missing JWT_SECRET or SERVICE_ROLE_KEY from local status');
  process.exit(2);
}

const now = Math.floor(Date.now() / 1000);
// Docker VM clocks on Windows can lag the host. Omit nbf; backdate iat generously.
const peopleAppJwt = signJwt(
  {
    role: 'people_app',
    iss: 'supabase',
    iat: now - 600,
    exp: now + 60 * 60 * 12,
  },
  jwtSecret,
);

writeFileSync(
  join(evidenceDir, 'local-stack-meta.json'),
  JSON.stringify(
    {
      apiUrl,
      dbHost: '127.0.0.1',
      dbPort: 54322,
      peopleSchemaExposed: true,
      jwtRole: 'people_app',
      serviceRolePresent: Boolean(serviceRole),
      secrets: 'redacted',
      at: new Date().toISOString(),
    },
    null,
    2,
  ),
);

// 4) Verify pre_request binding via docker psql (db query CLI is fragile for multi-statement)
{
  const ps = spawnSync(
    'docker',
    ['ps', '--format', '{{.Names}}', '--filter', 'name=supabase_db_'],
    { encoding: 'utf8', cwd: root, shell: process.platform === 'win32' },
  );
  const dbName = (ps.stdout || '').trim().split(/\r?\n/).filter(Boolean)[0];
  if (dbName) {
    run('docker', [
      'exec',
      '-i',
      dbName,
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-c',
      "alter role authenticator set pgrst.db_pre_request = 'people.pre_request'; notify pgrst, 'reload config'; notify pgrst, 'reload schema';",
    ]);
  }
}

// 5) Run runtime cert with process env only
const certEnv = {
  ...process.env,
  PEOPLE_CERT_ISOLATED: '1',
  PEOPLE_CERT_ALLOW_DOCKER_SQL: '1',
  PEOPLE_SUPABASE_URL: apiUrl,
  PEOPLE_SUPABASE_KEY: peopleAppJwt,
  PEOPLE_CERT_SERVICE_ROLE_KEY: serviceRole,
  PEOPLE_DATABASE_URL: dbUrl,
  PEOPLE_ADVP1_PROCESSES: '12',
  UNIVERSAL_PEOPLE_PERSIST: '1',
};
delete certEnv.UNIVERSAL_PEOPLE;

const cert = run('npx', ['tsx', 'scripts/runtime-cert-people-phase2c.mts'], {
  env: certEnv,
});

writeFileSync(
  join(evidenceDir, 'local-orchestrator-exit.json'),
  JSON.stringify(
    {
      runtimeCertExit: cert.status,
      at: new Date().toISOString(),
    },
    null,
    2,
  ),
);

process.exit(cert.status === 0 ? 0 : cert.status || 1);
