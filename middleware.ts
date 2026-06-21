import { createSlugPortalMiddleware } from '@ea/portal-chassis/middleware';
import { EA_PORTAL_COOKIE, EA_PORTAL_SESSION } from '@/lib/chassis/ea-portal';

const { middleware } = createSlugPortalMiddleware({
  cookieName: EA_PORTAL_COOKIE,
  loginPath: '/portal/login',
  session: EA_PORTAL_SESSION,
});

export default middleware;

export const config = {
  matcher: ['/portal/:slug', '/portal/:slug/:path*'],
};
