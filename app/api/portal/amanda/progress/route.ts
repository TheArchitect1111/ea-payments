import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { getAmandaCourseProgress, updateAmandaCourseProgress, submitAmandaAssessment } from '@/lib/amanda-catherine/progress-store';
import { resolveAmandaAudience } from '@/lib/amanda-catherine/audience';
import { accountCanAccessCourse } from '@/lib/amanda-catherine/course-content';
import { getAmandaAssignedCourseIds } from '@/lib/amanda-catherine/client-access';
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
  const audience = await resolveAmandaAudience({ portalSlug: tenant.portalSlug, email: auth.session.email, role: auth.session.role });
  const assignedCourseIds = await getAmandaAssignedCourseIds(tenant.portalSlug, auth.session.email);
  if (!accountCanAccessCourse(audience, assignedCourseIds, courseId, Boolean(auth.session.role && roleAtLeast(auth.session.role, 'admin')))) return NextResponse.json({ error: 'This course is not assigned to this account.' }, { status: 403 });
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
    practicalRequirements?: string[];
    assessmentSubmission?: { notes?: string; evidenceUrl?: string };
  };
  if (!body.courseId) return NextResponse.json({ error: 'courseId required.' }, { status: 400 });
  try {
    const audience = await resolveAmandaAudience({ portalSlug: tenant.portalSlug, email: auth.session.email, role: auth.session.role });
    const assignedCourseIds = await getAmandaAssignedCourseIds(tenant.portalSlug, auth.session.email);
    if (!accountCanAccessCourse(audience, assignedCourseIds, body.courseId, Boolean(auth.session.role && roleAtLeast(auth.session.role, 'admin')))) return NextResponse.json({ error: 'This course is not assigned to this account.' }, { status: 403 });
    if (body.assessmentSubmission) {
      const notes = String(body.assessmentSubmission.notes || '').trim();
      const evidenceUrl = String(body.assessmentSubmission.evidenceUrl || '').trim();
      if (!notes || notes.length > 5000 || evidenceUrl.length > 2000) return NextResponse.json({ error: 'Provide assessment notes within the allowed length.' }, { status: 400 });
      if (evidenceUrl) {
        try { if (new URL(evidenceUrl).protocol !== 'https:') throw new Error(); }
        catch { return NextResponse.json({ error: 'Use a secure HTTPS evidence link.' }, { status: 400 }); }
      }
      return NextResponse.json({ ok: true, progress: await submitAmandaAssessment(tenant.portalSlug, auth.session.email, body.courseId, { notes, evidenceUrl: evidenceUrl || undefined }) });
    }
    const progress = await updateAmandaCourseProgress(tenant.portalSlug, auth.session.email, body.courseId, {
      completedLessons: body.completedLessons,
      practicalRequirements: body.practicalRequirements,
    });
    return NextResponse.json({ ok: true, progress });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update course progress.';
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
