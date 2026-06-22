/** Hosts that should land on the Simplifi product shell (same Vercel project). */
export const SIMPLIFI_APP_HOSTS = new Set(
  [
    'app.simplifi.ai',
    'www.app.simplifi.ai',
    'app-simplifi.vercel.app',
    process.env.SIMPLIFI_APP_HOST,
  ]
    .filter(Boolean)
    .map((h) => h!.toLowerCase()),
);

const PATH_ALIASES: Record<string, string> = {
  '/': '/simplifi/workspace',
  '/app': '/simplifi/workspace',
  '/workspace': '/simplifi/workspace',
  '/capture': '/simplifi/capture',
  '/login': '/portal/login',
};

export function resolveSimplifiAppHostRedirect(
  host: string | null,
  pathname: string,
): string | null {
  if (!host) return null;
  const normalized = host.split(':')[0].toLowerCase();
  if (!SIMPLIFI_APP_HOSTS.has(normalized)) return null;

  const path = pathname || '/';
  if (path.startsWith('/simplifi') || path.startsWith('/api') || path.startsWith('/portal')) {
    return null;
  }

  return PATH_ALIASES[path] ?? null;
}

export const SIMPLIFI_APP_URL =
  process.env.NEXT_PUBLIC_SIMPLIFI_APP_URL?.replace(/\/$/, '') ?? 'https://app.simplifi.ai';
