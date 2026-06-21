import { NextRequest, NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE, verifyEAPortalSessionEdge } from '@/lib/ea-portal-auth-edge';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/portal/login' || pathname.startsWith('/api/portal/login')) {
    return NextResponse.next();
  }

  const slugMatch = pathname.match(/^\/portal\/([^/]+)/);
  if (!slugMatch) return NextResponse.next();

  const slug = slugMatch[1];
  if (slug === 'login') return NextResponse.next();
  const token = request.cookies.get(EA_PORTAL_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET ?? '';

  if (!token) {
    return NextResponse.redirect(new URL('/portal/login', request.url));
  }

  const session = await verifyEAPortalSessionEdge(token, secret);
  if (!session) {
    return NextResponse.redirect(new URL('/portal/login', request.url));
  }

  if (session.slug !== slug) {
    return NextResponse.redirect(new URL(`/portal/${session.slug}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/:slug', '/portal/:slug/:path*'],
};
