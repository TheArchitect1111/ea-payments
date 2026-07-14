import type { NextRequest } from 'next/server';
import { isPortalVanityHost } from '@/lib/ctp-portal-host';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function nonVanityOrigin(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null;
  try {
    const normalized = stripTrailingSlash(raw.trim());
    const host = new URL(normalized).host;
    if (isPortalVanityHost(host)) return null;
    return normalized;
  } catch {
    return null;
  }
}

/**
 * Stable origin for auth emails + post-login redirects.
 * Never use the portal vanity host — local DNS often cannot resolve it yet,
 * which shows up as "This site can't be reached" after sign-in.
 */
export function authSiteOrigin(req: NextRequest): string {
  const requestHost = req.headers.get('host');
  if (requestHost && !isPortalVanityHost(requestHost)) {
    return stripTrailingSlash(req.nextUrl.origin);
  }

  return (
    nonVanityOrigin(process.env.NEXT_PUBLIC_BASE_URL) ||
    nonVanityOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
    nonVanityOrigin(EA_PLATFORM_URL) ||
    'https://www.efficiencyarchitects.online'
  );
}
