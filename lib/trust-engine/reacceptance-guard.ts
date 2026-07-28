/**
 * Server-side reacceptance enforcement helpers.
 */
import { headers } from 'next/headers';
import { buildClientLegalStatus } from './status';
import { getClientLegalProfile } from './client-store';
import type { ClientLegalProfile, TrustProductId } from './types';

const EXEMPT_PREFIXES = [
  '/legal',
  '/trust',
  '/api/trust/accept',
  '/portal/login',
  '/portal/sign-in',
  '/portal/register',
  '/portal/forgot-password',
  '/portal/reset-password',
  '/simplifi/login',
  '/simplifi/register',
  '/simplifi/forgot-password',
  '/simplifi/reset-password',
];

export function isLegalGateExemptPath(pathname: string): boolean {
  const path = pathname.split('?')[0] || '/';
  return EXEMPT_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export async function resolveRequestPathname(): Promise<string> {
  const h = await headers();
  return h.get('x-pathname') || h.get('x-invoke-path') || '';
}

export async function evaluateReacceptanceGate(input: {
  productId: TrustProductId;
  clientId: string;
  pathname?: string;
}): Promise<{
  blocked: boolean;
  profile: ClientLegalProfile | null;
  pathname: string;
}> {
  const pathname = input.pathname || (await resolveRequestPathname());
  if (pathname && isLegalGateExemptPath(pathname)) {
    return { blocked: false, profile: null, pathname };
  }

  const profile = await getClientLegalProfile(input.clientId);
  const status = buildClientLegalStatus({ productId: input.productId, profile });
  const needing = status.requiringAcceptance.filter((d) => !d.requiresEsign);
  return {
    blocked: needing.length > 0,
    profile,
    pathname,
  };
}

export function clientIdFromPortalSlug(slug: string): string {
  return `portal_${slug}`;
}
