import { issueSignedToken, presignUrl } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { resolveAmandaAudience } from '@/lib/amanda-catherine/audience';
import { getAmandaAssignedCourseIds } from '@/lib/amanda-catherine/client-access';
import { accountCanAccessCourse } from '@/lib/amanda-catherine/course-content';
import { findAmandaCourseResource } from '@/lib/amanda-catherine/course-resources';
import { roleAtLeast } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> },
) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);

  const tenant = portalTenant(auth.session);
  const { resourceId } = await params;
  const resource = findAmandaCourseResource(resourceId);
  if (!tenant.portalSlug.startsWith('amanda-catherine') || !auth.session.email || !resource) {
    return NextResponse.json({ error: 'Amanda course resource not found.' }, { status: 404 });
  }

  const audience = await resolveAmandaAudience({
    portalSlug: tenant.portalSlug,
    email: auth.session.email,
    role: auth.session.role,
  });
  const assignedCourseIds = await getAmandaAssignedCourseIds(tenant.portalSlug, auth.session.email);
  const isAdmin = Boolean(auth.session.role && roleAtLeast(auth.session.role, 'admin'));
  if (!accountCanAccessCourse(audience, assignedCourseIds, resource.courseId, isAdmin)) {
    return NextResponse.json({ error: 'This course is not assigned to this account.' }, { status: 403 });
  }

  try {
    const validUntil = Date.now() + 5 * 60 * 1000;
    const token = await issueSignedToken({
      pathname: resource.pathname,
      operations: ['get'],
      validUntil,
    });
    const { presignedUrl } = await presignUrl(token, {
      pathname: resource.pathname,
      operation: 'get',
      validUntil,
      useCache: true,
    });
    return NextResponse.redirect(presignedUrl, 307);
  } catch (error) {
    console.error('[amanda-resource] signed URL creation failed', {
      resourceId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Course file is temporarily unavailable.' }, { status: 503 });
  }
}
