/**
 * People Postgres / PostgREST client (Phase 2C).
 *
 * Uses a Supabase API key for gateway access plus a short-lived people_app
 * bearer JWT. Never uses the shared Simplifi service_role for DML (INV-29).
 */
import { createHmac } from 'node:crypto';

import { peopleUnavailable } from '@/lib/people/errors';

export type PeopleDbConfig = { url: string; apiKey: string; accessToken: string };

function base64url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function mintPeopleAppJwt(secret: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      role: 'people_app',
      iss: 'supabase',
      iat: now - 30,
      exp: now + 5 * 60,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signature = createHmac('sha256', secret).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

export function peopleDbConfig(): PeopleDbConfig | null {
  const url = (
    process.env.PEOPLE_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    ''
  ).replace(/\/$/, '');
  // Supabase requires an API key for the gateway and a separate JWT for the
  // database role. The people_app JWT must never be reused as the apikey.
  const apiKey =
    process.env.PEOPLE_SUPABASE_API_KEY?.trim() ||
    process.env.PEOPLE_SUPABASE_ANON_KEY?.trim() ||
    '';
  const jwtSecret = process.env.PEOPLE_SUPABASE_JWT_SECRET?.trim() || '';
  const accessToken = jwtSecret
    ? mintPeopleAppJwt(jwtSecret)
    : process.env.PEOPLE_SUPABASE_KEY?.trim() ||
      process.env.PEOPLE_SUPABASE_APP_KEY?.trim() ||
      '';
  if (!url || !apiKey || !accessToken) return null;
  return { url, apiKey, accessToken };
}

export function isPeoplePostgresConfigured(): boolean {
  return peopleDbConfig() !== null;
}

export async function peopleRest<T = unknown>(
  path: string,
  init: RequestInit & { prefer?: string; organizationId?: string } = {},
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  const cfg = peopleDbConfig();
  if (!cfg) {
    return { ok: false, error: 'People Postgres not configured' };
  }

  const headers = new Headers(init.headers);
  headers.set('apikey', cfg.apiKey);
  headers.set('Authorization', `Bearer ${cfg.accessToken}`);
  headers.set('Content-Type', 'application/json');
  // PostgREST profile for dedicated `people` schema (must be exposed in API settings).
  headers.set('Accept-Profile', 'people');
  headers.set('Content-Profile', 'people');
  if (init.prefer) headers.set('Prefer', init.prefer);
  // Tenant GUC for RLS when using people_app (defense-in-depth).
  if (init.organizationId) {
    headers.set('X-People-Organization-Id', init.organizationId);
  }

  try {
    const res = await fetch(`${cfg.url}/rest/v1/${path.replace(/^\//, '')}`, {
      ...init,
      headers,
    });
    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        data = text;
      }
    }
    if (!res.ok) {
      const msg =
        typeof data === 'object' && data && 'message' in data
          ? String((data as { message: unknown }).message)
          : text || res.statusText;
      return { ok: false, error: msg, status: res.status };
    }
    return { ok: true, data: data as T };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'People Postgres request failed',
    };
  }
}

export async function peopleRpc<T = unknown>(
  fn: string,
  args: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  const cfg = peopleDbConfig();
  if (!cfg) {
    throw peopleUnavailable('People persistence enabled without Postgres credentials');
  }
  return peopleRest<T>(`rpc/${fn}`, {
    method: 'POST',
    body: JSON.stringify(args),
  });
}

export function assertPeoplePostgresReady(): void {
  if (!isPeoplePostgresConfigured()) {
    throw peopleUnavailable(
      'People persistence enabled without PEOPLE_SUPABASE_URL / PEOPLE_SUPABASE_API_KEY / People JWT credentials',
    );
  }
}
