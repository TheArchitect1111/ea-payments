/**
 * Canonical product entry URLs — use these in docs, QR codes, and tester messages.
 * Host aliases (ea-simplifi.vercel.app) route via middleware when added in Vercel Domains.
 */
export const PLATFORM_BASE =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? 'https://ea-payments.vercel.app';

export const PRODUCT_LINKS = {
  home: PLATFORM_BASE,
  simplifi: `${PLATFORM_BASE}/simplifi`,
  simplifiCapture: `${PLATFORM_BASE}/simplifi/capture`,
  magnifiDemo: `${PLATFORM_BASE}/consider/selena`,
  amplifi: `${PLATFORM_BASE}/amplifi`,
  pulse: `${PLATFORM_BASE}/portal/login?next=${encodeURIComponent('/portal/demo-client/pulse')}`,
  portalLogin: `${PLATFORM_BASE}/portal/login`,
  assessment: `${PLATFORM_BASE}/assessment`,
} as const;

/** Vercel project domains → default landing path (root `/` redirect). */
export const PRODUCT_HOST_ENTRY: Record<string, string> = {
  'ea-simplifi.vercel.app': '/simplifi/capture',
  'ea-magnifi.vercel.app': '/consider/selena',
  'ea-amplifi.vercel.app': '/amplifi',
  'ea-pulse.vercel.app': '/portal/login?next=/portal/demo-client/pulse',
  'app.simplifi.ai': '/simplifi/workspace',
  'app-simplifi.vercel.app': '/simplifi/workspace',
};

export function resolveProductHostRedirect(host: string | null, pathname: string): string | null {
  if (!host || pathname !== '/') return null;
  const normalized = host.split(':')[0].toLowerCase();
  return PRODUCT_HOST_ENTRY[normalized] ?? null;
}
