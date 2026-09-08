import { get } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { getClientByPortalSlug } from '@/lib/airtable';
import { EA_PORTAL_COOKIE, signSession, verifySession } from '@/lib/ea-portal-auth';
import { AMANDA_OWNER_PATH, AMANDA_PORTAL_SLUG } from '@/lib/amanda-catherine/constants';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { getAmandaCourseContent } from '@/lib/amanda-catherine/course-content';
import { AMANDA_COURSE_RESOURCES } from '@/lib/amanda-catherine/course-resources';

export const dynamic = 'force-dynamic';

async function authenticatedResponse(origin: string, path: string, token: string) {
  return fetch(`${origin}${path}`, {
    method: 'GET',
    headers: { cookie: `${EA_PORTAL_COOKIE}=${token}` },
    redirect: 'manual',
    cache: 'no-store',
  });
}

const OWNER_MENU_ROUTES = {
  dashboard: '',
  updateHub: 'updates',
  appointments: 'calendar',
  clients: 'people',
  programsCourses: 'learning',
  documents: 'documents',
  marketing: 'amplifi',
  reports: 'reports',
  eva: 'ask',
  settings: 'settings',
} as const;

export async function GET(req: NextRequest) {
  const checks = {
    clientRecord: false,
    sessionSigning: false,
    sessionVerification: false,
    canonicalSlug: false,
    authenticatedOwnerRoute: false,
    authenticatedPortalHome: false,
    authenticatedMemberRoute: false,
    premiumOwnerDashboard: false,
    allMenuRoutes: false,
  };

  const menuRoutes: Record<string, { path: string; status: number; ok: boolean; redirect: string | null }> = {};
  const courseInventory: Record<string, { lessons: number; videos: number; lessonResources: number }> = {};
  const materialInventory: Record<string, { pathname: string; available: boolean; statusCode: number | null }> = {};

  try {
    const client = await getClientByPortalSlug(AMANDA_PORTAL_SLUG);
    checks.clientRecord = Boolean(client);

    const token = await signSession({
      slug: AMANDA_PORTAL_SLUG,
      role: 'owner',
      email: 'amanda-login-canary@efficiencyarchitects.online',
    });
    checks.sessionSigning = Boolean(token);

    const session = token ? await verifySession(token) : null;
    checks.sessionVerification = Boolean(session);
    checks.canonicalSlug = session?.slug === AMANDA_PORTAL_SLUG;

    if (token && checks.clientRecord && checks.canonicalSlug) {
      const [ownerResponse, portalHomeResponse, memberResponse] = await Promise.all([
        authenticatedResponse(req.nextUrl.origin, AMANDA_OWNER_PATH, token),
        authenticatedResponse(req.nextUrl.origin, `/portal/${AMANDA_PORTAL_SLUG}`, token),
        authenticatedResponse(req.nextUrl.origin, `/portal/${AMANDA_PORTAL_SLUG}/member`, token),
      ]);
      checks.authenticatedOwnerRoute = ownerResponse.status === 200;
      checks.authenticatedPortalHome = portalHomeResponse.status === 200;
      checks.authenticatedMemberRoute = memberResponse.status === 200;

      if (portalHomeResponse.status === 200) {
        const body = await portalHomeResponse.text();
        checks.premiumOwnerDashboard =
          body.includes('Owner portal') &&
          body.includes('Quick Actions') &&
          body.includes('Ask Eva') &&
          body.includes('Business Overview');
      }

      const menuResults = await Promise.all(
        Object.entries(OWNER_MENU_ROUTES).map(async ([key, route]) => {
          const path = route ? `/portal/${AMANDA_PORTAL_SLUG}/${route}` : `/portal/${AMANDA_PORTAL_SLUG}`;
          const response = await authenticatedResponse(req.nextUrl.origin, path, token);
          return [key, {
            path,
            status: response.status,
            ok: response.status === 200,
            redirect: response.headers.get('location'),
          }] as const;
        }),
      );

      for (const [key, result] of menuResults) menuRoutes[key] = result;
      checks.allMenuRoutes = menuResults.every(([, result]) => result.ok && !result.redirect);
    }

    await Promise.all(AMANDA_COURSES.map(async (course) => {
      const content = await getAmandaCourseContent(AMANDA_PORTAL_SLUG, course.id);
      courseInventory[course.id] = {
        lessons: content.lessons.length,
        videos: content.lessons.filter((lesson) => Boolean(lesson.videoUrl)).length,
        lessonResources: content.lessons.filter((lesson) => Boolean(lesson.resourceUrl)).length,
      };
    }));

    await Promise.all(AMANDA_COURSE_RESOURCES.map(async (resource) => {
      try {
        const result = await get(resource.pathname, { access: 'private' });
        materialInventory[resource.id] = {
          pathname: resource.pathname,
          available: Boolean(result && result.statusCode === 200),
          statusCode: result?.statusCode ?? null,
        };
      } catch {
        materialInventory[resource.id] = { pathname: resource.pathname, available: false, statusCode: null };
      }
    }));

    const ok = Object.values(checks).every(Boolean);
    return NextResponse.json({ ok, checks, menuRoutes, courseInventory, materialInventory }, { status: ok ? 200 : 503 });
  } catch {
    return NextResponse.json({ ok: false, checks, menuRoutes, courseInventory, materialInventory }, { status: 503 });
  }
}
