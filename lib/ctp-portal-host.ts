/**
 * Portal vanity host — portal.efficiencyarchitects.online/{client}
 * Rewrites to /portal/{slug} while keeping the clean host URL.
 */

const DEFAULT_PORTAL_HOSTS = [
  'portal.efficiencyarchitects.online',
  'portal.efficiencyarchitects.app',
];

/** First-path segments that must never be treated as a client slug. */
export const PORTAL_HOST_RESERVED = new Set([
  '',
  'api',
  'admin',
  'portal',
  'login',
  'sign-in',
  'register',
  'forgot-password',
  'reset-password',
  '_next',
  'favicon.ico',
  'images',
  'fonts',
  'public',
  'robots.txt',
  'sitemap.xml',
  'health',
  'buy',
  'assessment',
  'discover',
  'ctp-intake',
  'reveal',
  'proposal',
  'site',
  'sites',
  'simplifi',
  'amplifi',
  'capture',
  'start',
  'try',
  'story',
  'consider',
]);

export function portalHostList(): string[] {
  const fromEnv = (process.env.EA_PORTAL_HOSTS ?? process.env.EA_PORTAL_HOST ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...fromEnv, ...DEFAULT_PORTAL_HOSTS])];
}

export function normalizeHost(host: string | null | undefined): string {
  return (host ?? '').split(':')[0]?.toLowerCase() ?? '';
}

export function isPortalVanityHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  return portalHostList().includes(normalized);
}

export function primaryPortalHost(): string {
  return portalHostList()[0] ?? 'portal.efficiencyarchitects.online';
}

/**
 * Public client portal URL using the vanity host when available.
 * Example: https://portal.efficiencyarchitects.online/acme/ctp
 */
function portalHostOrigin(): string {
  const host = primaryPortalHost();
  const proto = process.env.EA_PORTAL_HOST_PROTOCOL?.replace(/:$/, '') || 'https';
  return `${proto}://${host}`;
}

export function publicPortalUrl(slug: string, pathSuffix = ''): string {
  const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  const suffix = pathSuffix
    ? `/${pathSuffix.replace(/^\/+|\/+$/g, '')}`
    : '';
  return `${portalHostOrigin()}/${cleanSlug}${suffix}`;
}

/** Vanity-host login — middleware maps /login → /portal/login. */
export function publicPortalLoginUrl(): string {
  return `${portalHostOrigin()}/login`;
}

export type PortalVanityHostProbe = {
  ok: boolean;
  skipped: boolean;
  host: string;
  loginUrl: string;
  status?: number;
  error?: string;
};

/**
 * Best-effort probe that the vanity portal host resolves in production DNS/Vercel.
 * Skipped when EA_SKIP_PORTAL_HOST_PROBE=1 (local/CI without public DNS).
 */
export async function probePortalVanityHost(): Promise<PortalVanityHostProbe> {
  const host = primaryPortalHost();
  const loginUrl = publicPortalLoginUrl();

  if (process.env.EA_SKIP_PORTAL_HOST_PROBE === '1') {
    return { ok: false, skipped: true, host, loginUrl, error: 'Probe skipped (EA_SKIP_PORTAL_HOST_PROBE=1).' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(loginUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'EfficiencyArchitects-CTP-VanityProbe/1.0',
        Accept: 'text/html',
      },
    });
    clearTimeout(timeout);
    const ok = res.ok || res.status === 401 || res.status === 403;
    return {
      ok,
      skipped: false,
      host,
      loginUrl,
      status: res.status,
      error: ok ? undefined : `Unexpected HTTP ${res.status} from ${loginUrl}`,
    };
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      host,
      loginUrl,
      error: err instanceof Error ? err.message : 'Vanity host probe failed',
    };
  }
}

/**
 * Resolve a vanity-host request to an internal /portal rewrite path.
 * Returns null when this request should not be rewritten.
 */
export function resolvePortalHostRewrite(
  host: string | null | undefined,
  pathname: string,
): { rewritePath: string } | { redirectPath: string } | null {
  if (!isPortalVanityHost(host)) return null;

  if (pathname === '/' || pathname === '') {
    return { redirectPath: '/portal/login' };
  }

  const segments = pathname.split('/').filter(Boolean);
  const first = (segments[0] ?? '').toLowerCase();

  // Auth shortcuts on the vanity host.
  if (
    first === 'login' ||
    first === 'sign-in' ||
    first === 'register' ||
    first === 'forgot-password' ||
    first === 'reset-password'
  ) {
    return { redirectPath: `/portal/${segments.join('/')}` };
  }

  if (!first || PORTAL_HOST_RESERVED.has(first)) {
    return null;
  }

  const rest = segments.slice(1).join('/');
  const rewritePath = rest ? `/portal/${first}/${rest}` : `/portal/${first}`;
  return { rewritePath };
}
