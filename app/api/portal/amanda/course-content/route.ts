import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { resolveAmandaAudience } from '@/lib/amanda-catherine/audience';
import {
  audienceCanAccessCourse,
  getAmandaCourseContent,
  saveAmandaCourseContent,
  type AmandaLessonContent,
} from '@/lib/amanda-catherine/course-content';
import { roleAtLeast } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const courseId = req.nextUrl.searchParams.get('courseId') || '';
  if (!tenant.portalSlug.startsWith('amanda-catherine') || !auth.session.email || !courseId) {
    return NextResponse.json({ error: 'Amanda course access required.' }, { status: 400 });
  }
  const audience = await resolveAmandaAudience({
    portalSlug: tenant.portalSlug,
    email: auth.session.email,
    role: auth.session.role,
  });
  if (!audienceCanAccessCourse(audience, courseId)) {
    return NextResponse.json({ error: 'This course is not assigned to this account.' }, { status: 403 });
  }
  return NextResponse.json({ ok: true, content: await getAmandaCourseContent(tenant.portalSlug, courseId) });
}

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  if (!tenant.portalSlug.startsWith('amanda-catherine') || !auth.session.role || !roleAtLeast(auth.session.role, 'admin')) {
    return NextResponse.json({ error: 'Amanda administrator access required.' }, { status: 403 });
  }
  const body = await req.json() as { courseId?: string; lessons?: AmandaLessonContent[] };
  if (!body.courseId || !Array.isArray(body.lessons)) {
    return NextResponse.json({ error: 'Course and lesson content are required.' }, { status: 400 });
  }
  try {
    const content = await saveAmandaCourseContent(tenant.portalSlug, body.courseId, body.lessons);
    return NextResponse.json({ ok: true, content });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save course.' }, { status: 400 });
  }
}
