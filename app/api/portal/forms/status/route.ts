import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { updatePortalFormSubmissionStatus } from '@/lib/portal-forms/store';
import type { PortalFormStatus } from '@/lib/portal-forms/types';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

const ALLOWED: PortalFormStatus[] = ['submitted', 'reviewed', 'accepted', 'rejected'];

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'portal' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (!roleAtLeast(normalizeRole(auth.session.role), 'staff')) {
    return NextResponse.json({ error: 'Staff access required.' }, { status: 403 });
  }

  let body: { submissionId?: string; status?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const submissionId = body.submissionId?.trim();
  const status = body.status?.trim() as PortalFormStatus | undefined;
  if (!submissionId || !status || !ALLOWED.includes(status)) {
    return NextResponse.json({ error: 'submissionId and valid status required.' }, { status: 400 });
  }

  const tenant = portalTenant(auth.session);
  const updated = await updatePortalFormSubmissionStatus({
    portalSlug: tenant.portalSlug,
    submissionId,
    status,
  });

  if (!updated) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, submission: updated });
}
