import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { getAmandaCourseProgress, updateAmandaCourseProgress } from '@/lib/amanda-catherine/progress-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const courseId = req.nextUrl.searchParams.get('courseId') || '';
  if (!tenant.portalSlug.startsWith('amanda-catherine') || !auth.session.email || !courseId) {
    return NextResponse.json({ error: 'Amanda course access required.' }, { status: 400 });
  }
  return NextResponse.json({ ok: true, progress: await getAmandaCourseProgress(tenant.portalSlug, auth.session.email, courseId) });
}

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  if (!tenant.portalSlug.startsWith('amanda-catherine') || !auth.session.email) {
    return NextResponse.json({ error: 'Amanda course access required.' }, { status: 400 });
  }
  const body = await req.json() as {
    courseId?: string;
    completedLessons?: string[];
    assessmentScore?: number;
    practicalRequirements?: string[];
  };
  if (!body.courseId) return NextResponse.json({ error: 'courseId required.' }, { status: 400 });
  const progress = await updateAmandaCourseProgress(tenant.portalSlug, auth.session.email, body.courseId, {
    completedLessons: body.completedLessons,
    assessmentScore: body.assessmentScore,
    practicalRequirements: body.practicalRequirements,
  });
  return NextResponse.json({ ok: true, progress });
}
