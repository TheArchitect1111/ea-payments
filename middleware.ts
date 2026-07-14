import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

import { createSlugPortalMiddleware } from '@ea/portal-chassis/middleware';

import { can, normalizeAdminRole } from '@/lib/rbac';
import { EA_PORTAL_COOKIE, EA_PORTAL_SESSION } from '@/lib/chassis/ea-portal';
import { resolveProductHostRedirect } from '@/lib/product-routes';
import { resolveCustomDomainRedirect } from '@/lib/marketing-urls';
import { resolveSimplifiAppHostRedirect } from '@/lib/simplifi-app-host';
import { resolvePortalHostRewrite } from '@/lib/ctp-portal-host';

const EA_ADMIN_COOKIE = 'ea_admin_session';

type EdgeAdminSession = {
  role?: string;
};

function adminSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? '';
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return atob(padded);
}

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function signPayloadEdge(encoded: string): Promise<string> {
  const sec = adminSessionSecret();
  if (!sec) return '';
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(sec),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encoded));
  return bytesToHex(signature);
}

async function parseAdminSessionEdge(token: string | undefined): Promise<EdgeAdminSession | null> {
  if (!token || !adminSessionSecret()) return null;

  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return null;

  const encoded = token.slice(0, dotIdx);
  const provided = token.slice(dotIdx + 1);

  try {
    const expectedSig = await signPayloadEdge(encoded);
    if (!expectedSig || provided !== expectedSig) return null;
    const payload = JSON.parse(decodeBase64Url(encoded)) as {
      role?: string;
      exp?: number;
    };
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    if (typeof payload.role !== 'string' || !payload.role.trim()) return null;
    return { role: payload.role };
  } catch {
    return null;
  }
}

const { middleware: portalMiddleware } = createSlugPortalMiddleware({

  cookieName: EA_PORTAL_COOKIE,

  loginPath: '/portal/login',

  session: EA_PORTAL_SESSION,

});

const PUBLIC_PORTAL_AUTH_PATHS = new Set([
  '/portal/login',
  '/portal/sign-in',
  '/portal/register',
  '/portal/forgot-password',
  '/portal/reset-password',
]);

function isPublicPortalAuthPath(pathname: string): boolean {
  return [...PUBLIC_PORTAL_AUTH_PATHS].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

const PUBLIC_ADMIN_PATHS = new Set([
  '/admin/login',
  '/admin/sign-in',
  '/admin/register',
  '/admin/forgot-password',
  '/admin/reset-password',
]);

function isPublicAdminPath(pathname: string): boolean {
  return [...PUBLIC_ADMIN_PATHS].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}



export async function middleware(request: NextRequest) {

  const host = request.headers.get('host');

  const pathname = request.nextUrl.pathname;

  const portalHost = resolvePortalHostRewrite(host, pathname);
  if (portalHost) {
    if ('redirectPath' in portalHost) {
      const target = new URL(portalHost.redirectPath, request.url);
      target.search = request.nextUrl.search;
      return NextResponse.redirect(target);
    }
    const url = request.nextUrl.clone();
    url.pathname = portalHost.rewritePath;
    return NextResponse.rewrite(url);
  }

  const simplifiAppEntry = resolveSimplifiAppHostRedirect(host, pathname);

  if (simplifiAppEntry) {

    const target = new URL(simplifiAppEntry, request.url);
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target);

  }



  const productEntry =

    resolveCustomDomainRedirect(host, pathname) ?? resolveProductHostRedirect(host, pathname);



  if (productEntry) {

    const target = new URL(productEntry, request.url);

    return NextResponse.redirect(target);

  }



  if (pathname.startsWith('/portal')) {
    if (isPublicPortalAuthPath(pathname)) {
      return NextResponse.next();
    }

    return (portalMiddleware as unknown as (req: NextRequest) => ReturnType<typeof portalMiddleware>)(request);

  }

  if (pathname.startsWith('/admin')) {
    if (isPublicAdminPath(pathname)) {
      return NextResponse.next();
    }

    const adminToken = request.cookies.get(EA_ADMIN_COOKIE)?.value;
    const adminSession = await parseAdminSessionEdge(adminToken);
    if (!adminSession) {
      const login = new URL('/admin/login', request.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }

    const role = normalizeAdminRole(adminSession.role);
    if (!can(role, 'admin:access')) {
      const login = new URL('/admin/login', request.url);
      login.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(login);
    }
  }



  return NextResponse.next();

}



export const config = {

  matcher: [
    '/',
    '/capture',
    '/app',
    '/workspace',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/portal/:slug',
    '/portal/:slug/:path*',
    '/admin/:path*',
    // Vanity portal host: portal.efficiencyarchitects.online/{client}
    '/:slug',
    '/:slug/:path*',
  ],

};
