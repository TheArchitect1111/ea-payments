/**
 * Mint ea_portal_session for cert tenant using ADMIN_SESSION_SECRET from .env.local.
 * Fallback when password login is blocked by email 2FA without inbox access.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  signHmacSession,
  makeSessionCookie,
  newSessionExpiry,
} from '@ea/portal-chassis/hmac';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv(filePath) {
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
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

const env = loadEnv(path.join(ROOT, '.env.local'));
for (const [k, v] of Object.entries(env)) {
  if (v) process.env[k] = v;
}

if (!process.env.ADMIN_SESSION_SECRET?.trim()) {
  console.error('ADMIN_SESSION_SECRET missing from .env.local');
  process.exit(1);
}

const config = {
  secretEnvKey: 'ADMIN_SESSION_SECRET',
  devSecret: 'ea-portal-dev-secret-change-in-prod',
};

const payload = {
  slug: 'ea-portal-cert-test',
  email: 'ea-portal-cert-test@efficiencyarchitects.online',
  role: 'owner',
  exp: newSessionExpiry(),
};

const token = await signHmacSession(payload, config);
if (!token) {
  console.error('signHmacSession returned null/empty');
  process.exit(1);
}

const cookie = makeSessionCookie('ea_portal_session', token);
const cookieLine = `ea_portal_session=${cookie.value}`;

fs.mkdirSync(path.join(ROOT, 'docs/audits'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs/audits/_runtime-cert-session-cookie.txt'), cookieLine);
fs.writeFileSync(
  path.join(ROOT, 'docs/audits/_runtime-cert-session-meta.json'),
  JSON.stringify(
    {
      cookieName: 'ea_portal_session',
      tokenLength: token.length,
      tokenPreview: `${token.slice(0, 10)}…`,
      payload: { slug: payload.slug, email: payload.email, role: payload.role, exp: payload.exp },
      cookieOpts: {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        path: cookie.path,
        maxAge: cookie.maxAge,
      },
      note: 'Cookie value in _runtime-cert-session-cookie.txt — do not commit',
    },
    null,
    2,
  ),
);

console.log('OK minted ea_portal_session for ea-portal-cert-test');
