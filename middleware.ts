import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

import { createSlugPortalMiddleware } from '@ea/portal-chassis/middleware';

import { EA_PORTAL_COOKIE, EA_PORTAL_SESSION } from '@/lib/chassis/ea-portal';

import { resolveProductHostRedirect } from '@/lib/product-routes';

import { resolveCustomDomainRedirect } from '@/lib/marketing-urls';

import { resolveSimplifiAppHostRedirect } from '@/lib/simplifi-app-host';



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



export function middleware(request: NextRequest) {

  const host = request.headers.get('host');

  const pathname = request.nextUrl.pathname;



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
  ],

};

