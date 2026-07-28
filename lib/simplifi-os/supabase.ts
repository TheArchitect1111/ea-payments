/**
 * Thin Supabase PostgREST client (service role) — no extra package required.
 * Used only when SIMPLIFI_OS_WRITE/READ and SUPABASE_* env are set.
 */

function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim();
  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseReady(): boolean {
  return supabaseConfig() !== null;
}

export async function supabaseRest<T = unknown>(
  path: string,
  init: RequestInit & { prefer?: string } = {},
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  const cfg = supabaseConfig();
  if (!cfg) {
    return { ok: false, error: 'Supabase not configured' };
  }

  const headers = new Headers(init.headers);
  headers.set('apikey', cfg.key);
  headers.set('Authorization', `Bearer ${cfg.key}`);
  headers.set('Content-Type', 'application/json');
  if (init.prefer) headers.set('Prefer', init.prefer);

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
    return { ok: false, error: err instanceof Error ? err.message : 'Supabase request failed' };
  }
}
