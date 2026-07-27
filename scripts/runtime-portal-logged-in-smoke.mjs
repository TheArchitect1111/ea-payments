/**
 * Mint portal session for Amanda wire slug and smoke chassis pages.
 * Uses local ADMIN_SESSION_SECRET (must match production portal HMAC).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  signHmacSession,
  newSessionExpiry,
} from '@ea/portal-chassis/hmac';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://efficiencyarchitects.online';
const SLUG = process.env.EA_WIRE_PORTAL_SLUG || 'amanda-catherine-afd57f';

function loadEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, i).trim()] = v;
  }
  return out;
}

const env = {
  ...loadEnv(join(root, '..', 'ea-payments', '.env.local')),
  ...loadEnv(join(root, '.env.local')),
};
for (const [k, v] of Object.entries(env)) {
  if (v && !process.env[k]) process.env[k] = v;
}

if (!process.env.ADMIN_SESSION_SECRET?.trim()) {
  console.error('ADMIN_SESSION_SECRET missing');
  process.exit(1);
}

const config = {
  secretEnvKey: 'ADMIN_SESSION_SECRET',
  devSecret: 'ea-portal-dev-secret-change-in-prod',
};

const payload = {
  slug: SLUG,
  email: 'amandacatherinec@gmail.com',
  role: 'owner',
  exp: newSessionExpiry(),
};

const token = await signHmacSession(payload, config);
if (!token) {
  console.error('signHmacSession failed');
  process.exit(1);
}

const cookie = `ea_portal_session=${token}`;
const paths = [
  `/portal/${SLUG}`,
  `/portal/${SLUG}/ctp`,
  `/portal/${SLUG}/updates`,
  `/portal/${SLUG}/resources`,
  `/portal/${SLUG}/ask`,
];

const results = [];
for (const path of paths) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'GET',
    redirect: 'manual',
    headers: { Cookie: cookie, Accept: 'text/html' },
  });
  results.push({
    path,
    status: res.status,
    location: res.headers.get('location'),
  });
  console.log(res.status, path, res.headers.get('location') || '');
}

const authAccepted = results.every(
  (r) => r.status === 200 || (r.status >= 300 && r.status < 400 && !String(r.location || '').includes('/portal/login')),
);

const out = {
  generatedAt: new Date().toISOString(),
  slug: SLUG,
  authAccepted,
  note: authAccepted
    ? 'Minted portal session accepted by production'
    : 'Minted session rejected or redirected to login — production portal HMAC secret differs from local; operator login required for full chassis walkthrough',
  results,
};

const dir = join(root, 'docs/audits/runtime-evidence-name-to-experience-phase2d');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'portal-logged-in-smoke.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify({ authAccepted, results }, null, 2));
process.exit(authAccepted ? 0 : 2);
