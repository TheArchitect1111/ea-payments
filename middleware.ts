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

export function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  const pathname = request.nextUrl.pathname;

  const simplifiAppEntry = resolveSimplifiAppHostRedirect(host, pathname);
  if (simplifiAppEntry) {
    return NextResponse.redirect(new URL(simplifiAppEntry, request.url));
  }

  const productEntry =
    resolveCustomDomainRedirect(host, pathname) ?? resolveProductHostRedirect(host, pathname);

  if (productEntry) {
    const target = new URL(productEntry, request.url);
    return NextResponse.redirect(target);
  }

  if (pathname.startsWith('/portal')) {
    return (portalMiddleware as unknown as (req: NextRequest) => ReturnType<typeof portalMiddleware>)(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/capture', '/app', '/workspace', '/login', '/portal/:slug', '/portal/:slug/:path*'],
};
