#!/usr/bin/env node
/**
 * Mint people_app JWT from .env.people.prod (Vercel pull) and upsert PEOPLE_SUPABASE_KEY.
 * Does not apply SQL grants. Does not enable UNIVERSAL_PEOPLE*.
 */
import { createHmac, createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const REF = process.env.PEOPLE_SUPABASE_PROJECT_REF?.trim() || 'dwygvwnjjaennksddniu';
const evidenceDir = join(root, 'docs', 'audits', 'runtime-evidence-people-phase2d-prod-preflight');
mkdirSync(evidenceDir, { recursive: true });

function loadEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    let v = line.slice(i + 1);
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, i)] = v;
  }
  return out;
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

function vercelUpsert(name, value) {
  spawnSync('npx', ['vercel', 'env', 'rm', name, 'production', '--yes'], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    env: process.env,
    timeout: 90_000,
  });
  const add = spawnSync('npx', ['vercel', 'env', 'add', name, 'production'], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    env: process.env,
    input: `${value}\n`,
    timeout: 90_000,
  });
  return add.status === 0;
}

const env = {
  ...loadEnv(join(root, '.env.people.prod')),
  ...loadEnv(join(root, '.env.local')),
  ...process.env,
};

const secret = (env.PEOPLE_SUPABASE_JWT_SECRET || env.SUPABASE_JWT_SECRET || '').trim();
const url = (env.PEOPLE_SUPABASE_URL || `https://${REF}.supabase.co`).replace(/\/$/, '');

if (!secret) {
  console.log(JSON.stringify({ ok: false, error: 'PEOPLE_SUPABASE_JWT_SECRET missing in .env.people.prod' }));
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
const jwt = signJwt(
  { role: 'people_app', iss: 'supabase', iat: now - 60, exp: now + 60 * 60 * 24 * 365 },
  secret,
);

const urlOk = vercelUpsert('PEOPLE_SUPABASE_URL', url);
const keyOk = vercelUpsert('PEOPLE_SUPABASE_KEY', jwt);

const res = await fetch(`${url}/rest/v1/`, {
  headers: {
    apikey: jwt,
    Authorization: `Bearer ${jwt}`,
    'Accept-Profile': 'people',
  },
});

const report = {
  artifact: 'people-phase2d-mint-key',
  at: new Date().toISOString(),
  projectRef: REF,
  vercel_url: urlOk,
  vercel_key: keyOk,
  rest_status: res.status,
  jwt_fp: fingerprint(jwt),
  ok: urlOk && keyOk && res.status === 200,
  note: 'Flags not touched. Schema USAGE grants still require SUPABASE_ACCESS_TOKEN + 011 SQL.',
};

writeFileSync(join(evidenceDir, 'mint-key-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
process.exit(report.ok ? 0 : 1);
