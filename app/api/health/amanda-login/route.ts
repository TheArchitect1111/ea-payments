import { get } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { getClientByPortalSlug } from '@/lib/airtable';
import { EA_PORTAL_COOKIE, signSession, verifySession } from '@/lib/ea-portal-auth';
import { AMANDA_OWNER_PATH, AMANDA_PORTAL_SLUG } from '@/lib/amanda-catherine/constants';
import { AMANDA_COURSES, ENTREPRENEURIAL_ARTIST_COURSE } from '@/lib/amanda-catherine/config';
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

const RECOVERED_VIDEO_CANDIDATES = [
  'Amanda-Catherine-Video-01.mp4',
  'Amanda-Catherine-Video-02.mp4',
  'Amanda-Catherine-Video-03.mp4',
  'VID-20260821-WA0006.mp4',
  'VID-20260821-WA0007.mp4',
  'VID-20260821-WA0008.mp4',
  'VID-20260821-WA0009.mp4',
] as const;

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
    allCourseResourceRoutes: false,
    entrepreneurialArtistPlaylistConfigured: false,
  };

  const menuRoutes: Record<string, { path: string; status: number; ok: boolean; redirect: string | null }> = {};
  const courseResourceRoutes: Record<string, { path: string; status: number; ok: boolean }> = {};
  const courseInventory: Record<string, { lessons: number; videos: number; lessonResources: number }> = {};
  const materialInventory: Record<string, { pathname: string; available: boolean; statusCode: number | null }> = {};
  const recoveredVideoInventory: Record<string, { available: boolean; statusCode: number | null }> = {};

  try {
    const client = await getClientByPortalSlug(AMANDA_PORTAL_SLUG);
    checks.clientRecord = Boolean(client);
    checks.entrepreneurialArtistPlaylistConfigured = Boolean(
      ENTREPRENEURIAL_ARTIST_COURSE.playlistUrl &&
      ENTREPRENEURIAL_ARTIST_COURSE.totalLessons === 6,
    );

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

      const resourceResults = await Promise.all(
        AMANDA_COURSE_RESOURCES.map(async (resource) => {
          const path = `/api/portal/amanda/resources/${resource.id}`;
          const response = await authenticatedResponse(req.nextUrl.origin, path, token);
          return [resource.id, { path, status: response.status, ok: response.status === 200 }] as const;
        }),
      );
      for (const [key, result] of resourceResults) courseResourceRoutes[key] = result;
      checks.allCourseResourceRoutes = resourceResults.length > 0 && resourceResults.every(([, result]) => result.ok);
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

    await Promise.all(RECOVERED_VIDEO_CANDIDATES.map(async (pathname) => {
      try {
        const result = await get(pathname, { access: 'private' });
        recoveredVideoInventory[pathname] = {
          available: Boolean(result && result.statusCode === 200),
          statusCode: result?.statusCode ?? null,
        };
      } catch {
        recoveredVideoInventory[pathname] = { available: false, statusCode: null };
      }
    }));

    const ok = Object.values(checks).every(Boolean);
    return NextResponse.json({ ok, checks, menuRoutes, courseResourceRoutes, courseInventory, materialInventory, recoveredVideoInventory }, { status: ok ? 200 : 503 });
  } catch {
    return NextResponse.json({ ok: false, checks, menuRoutes, courseResourceRoutes, courseInventory, materialInventory, recoveredVideoInventory }, { status: 503 });
  }
}
