/**
 * Mint EA admin Bearer tokens for operational scripts (same HMAC as web admin sessions).
 * Requires ADMIN_SESSION_SECRET — does not introduce a separate health credential.
 */
import { createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function loadDotEnvLocal(extraEnv = process.env) {
  const path = join(root, '.env.local');
  if (!existsSync(path)) return { ...extraEnv };
  const merged = { ...extraEnv };
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in merged) || !merged[key]) merged[key] = value;
  }
  return merged;
}

export function mintAdminBearerToken(env = process.env) {
  const secret = String(env.ADMIN_SESSION_SECRET || '').trim();
  if (!secret) return null;

  const payload = {
    email: 'ops@efficiencyarchitects.online',
    name: 'Launch Ops',
    role: 'owner',
    orgId: 'ea',
    mfa: true,
    exp: Date.now() + 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(encoded).digest('hex');
  return `${encoded}.${sig}`;
}

export function adminLaunchHealthHeaders(env = process.env) {
  const token = mintAdminBearerToken(env);
  if (!token) {
    throw new Error(
      'ADMIN_SESSION_SECRET is required to fetch full /api/health/launch diagnostics (EA admin Bearer session).',
    );
  }
  return {
    Authorization: `Bearer ${token}`,
    'X-EA-Realm': 'admin',
  };
}

/** Public summary only — no auth. */
export async function fetchLaunchHealthPublic(base) {
  const res = await fetch(`${String(base).replace(/\/$/, '')}/api/health/launch`, {
    redirect: 'manual',
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

/** Full diagnostic — requires ADMIN_SESSION_SECRET (minted admin session). */
export async function fetchLaunchHealthDiagnostic(base, env = loadDotEnvLocal()) {
  const headers = adminLaunchHealthHeaders(env);
  const res = await fetch(`${String(base).replace(/\/$/, '')}/api/health/launch`, {
    redirect: 'manual',
    headers,
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}
