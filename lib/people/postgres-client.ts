/**
 * People Postgres / PostgREST client (Phase 2C).
 *
 * Uses PEOPLE_SUPABASE_URL + PEOPLE_SUPABASE_KEY (people_app), never the shared
 * Simplifi service_role key for DML (INV-29). No new npm packages.
 */
import { peopleUnavailable } from '@/lib/people/errors';

export type PeopleDbConfig = { url: string; key: string };

export function peopleDbConfig(): PeopleDbConfig | null {
  const url = (
    process.env.PEOPLE_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    ''
  ).replace(/\/$/, '');
  // Prefer People-specific key; never require shared service_role for People SoR.
  const key =
    process.env.PEOPLE_SUPABASE_KEY?.trim() ||
    process.env.PEOPLE_SUPABASE_APP_KEY?.trim() ||
    '';
  if (!url || !key) return null;
  return { url, key };
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
  headers.set('apikey', cfg.key);
  headers.set('Authorization', `Bearer ${cfg.key}`);
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
      'People persistence enabled without PEOPLE_SUPABASE_URL / PEOPLE_SUPABASE_KEY',
    );
  }
}
