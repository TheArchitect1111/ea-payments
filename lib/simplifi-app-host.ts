/** Hosts that should land on the Simplifi product shell (same Vercel project). */
export const SIMPLIFI_APP_HOSTS = new Set(
  [
    // EA-owned branded host (preferred while simplifi.ai is not EA-controlled)
    'app.efficiencyarchitects.online',
    'www.app.efficiencyarchitects.online',
    // Legacy / aspirational hosts (keep until DNS ownership is confirmed)
    'simplifi.ai',
    'www.simplifi.ai',
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
  '/simplifiorb': '/simplifi/workspace',
  '/workspace': '/simplifi/workspace',
  '/capture': '/simplifi/capture',
  '/login': '/simplifi/login',
  '/register': '/simplifi/register',
  '/forgot-password': '/simplifi/forgot-password',
  '/reset-password': '/simplifi/reset-password',
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

/** Preferred Simplifi app host (EA-owned). Path entry is `/simplifiorb`. */
export const SIMPLIFI_APP_URL =
  process.env.NEXT_PUBLIC_SIMPLIFI_APP_URL?.replace(/\/$/, '') ??
  'https://app.efficiencyarchitects.online';

/** Public branded entry for testers and QR codes. */
export const SIMPLIFI_ORB_ENTRY_URL = `${SIMPLIFI_APP_URL}/simplifiorb`;
