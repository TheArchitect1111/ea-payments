import { get } from '@vercel/blob';
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

  const result = await get(resource.pathname, { access: 'private' });
  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: 'Course file is unavailable.' }, { status: 404 });
  }

  const disposition = resource.fileType === 'PDF' ? 'inline' : 'attachment';
  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType,
      'Content-Disposition': `${disposition}; filename="${resource.pathname.replaceAll('"', '')}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
