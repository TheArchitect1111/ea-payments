import Constants from 'expo-constants';

export type ApiResult<T = Record<string, unknown>> = T & { ok?: boolean; error?: string };

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;

export function getApiBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
    extra?.apiBaseUrl?.replace(/\/$/, '') ||
    'https://ea-payments.vercel.app'
  );
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<ApiResult<T>> {
  const { token, headers, ...rest } = init;
  const url = path.startsWith('http') ? path : `${getApiBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-EA-Realm': 'simplifi',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  });

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return { ok: false, error: `Request failed (${res.status})` } as ApiResult<T>;
  }

  const data = (await res.json()) as ApiResult<T>;
  if (!res.ok && !data.error) {
    return { ...data, ok: false, error: `Request failed (${res.status})` };
  }
  return data;
}

export async function requestMagicLink(email: string): Promise<ApiResult<{ message?: string }>> {
  return apiFetch('/api/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({
      email,
      realm: 'simplifi',
      next: 'simplifi://auth/callback',
    }),
  });
}

export async function exchangeSessionToken(
  magicToken: string,
): Promise<ApiResult<{ token?: string; session?: Record<string, unknown> }>> {
  return apiFetch('/api/auth/session', {
    method: 'POST',
    body: JSON.stringify({ token: magicToken }),
  });
}

export async function fetchMe(token: string) {
  return apiFetch('/api/simplifi/me', { token });
}

export async function fetchBrief(token: string) {
  return apiFetch('/api/simplifi/brief', { token });
}

export async function fetchWorkspace(token: string) {
  return apiFetch<{ workspace?: Record<string, unknown> }>('/api/simplifi/workspace', { token });
}

export async function analyzeUrl(
  token: string,
  body: { url: string; prospectName?: string; notes?: string },
) {
  return apiFetch<{ processing?: boolean; captureId?: string }>('/api/portal/captures/analyze', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

export async function logout(token: string | null) {
  return apiFetch('/api/auth/logout', { method: 'POST', token });
}

export async function registerPushToken(token: string, pushToken: string) {
  return apiFetch('/api/simplifi/push-token', {
    method: 'POST',
    token,
    body: JSON.stringify({ token: pushToken, platform: 'expo' }),
  });
}
