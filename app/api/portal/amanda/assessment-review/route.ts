import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { findMembership } from '@/lib/memberships';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { reviewAmandaAssessment } from '@/lib/amanda-catherine/progress-store';
import { getAmandaAssignedCourseIds } from '@/lib/amanda-catherine/client-access';
import { publishPlatformActivityEvent } from '@/lib/activity-events-store';

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'portal', slug: 'amanda-catherine' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (!auth.session.email || !roleAtLeast(normalizeRole(auth.session.role), 'staff')) return NextResponse.json({ error: 'Staff access required.' }, { status: 403 });
  const organization = await findOrganizationByPortalSlug('amanda-catherine');
  const membership = organization && !organization.id.startsWith('org_') ? await findMembership(auth.session.email, organization.id) : null;
  if (!membership || membership.status !== 'active' || !roleAtLeast(membership.role, 'staff')) return NextResponse.json({ error: 'Active Amanda staff membership required.' }, { status: 403 });
  const body = await req.json().catch(() => null) as { email?: string; courseId?: string; score?: number; practicalApproved?: boolean; notes?: string } | null;
  const email = String(body?.email || '').trim().toLowerCase();
  const courseId = String(body?.courseId || '');
  const notes = String(body?.notes || '').trim();
  if (!email || !courseId || typeof body?.score !== 'number' || !Number.isFinite(body.score) || body.score < 0 || body.score > 100 || typeof body.practicalApproved !== 'boolean' || !notes || notes.length > 5000) return NextResponse.json({ error: 'Learner, course, score, practical decision and review notes are required.' }, { status: 400 });
  if (!(await getAmandaAssignedCourseIds('amanda-catherine', email)).includes(courseId)) return NextResponse.json({ error: 'Course is not assigned to this learner.' }, { status: 403 });
  try {
    const progress = await reviewAmandaAssessment('amanda-catherine', email, courseId, { score: body.score, practicalApproved: body.practicalApproved, notes, reviewerEmail: auth.session.email });
    await publishPlatformActivityEvent({ organizationId: organization!.id, module: 'training', eventType: 'assessment_reviewed', title: 'Amanda assessment reviewed', summary: `${courseId} assessment review recorded`, priority: 60, actionUrl: '/portal/amanda-catherine/owner/academy', metadata: { courseId, certificateIssued: Boolean(progress.certificateIssuedAt) } });
    return NextResponse.json({ ok: true, progress });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Review could not be saved.' }, { status: 409 }); }
}
