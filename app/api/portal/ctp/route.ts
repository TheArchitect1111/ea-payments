import { NextResponse } from 'next/server';
import { getClientByPortalSlug } from '@/lib/airtable';
import { guardPortalApiCookie, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { buildCtpPortalStatusView } from '@/lib/ctp-portal-status';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';

export const dynamic = 'force-dynamic';

/** CTP lifecycle status for the authenticated portal tenant. */
export async function GET() {
  const auth = await guardPortalApiCookie();
  if (!auth.ok) return portalApiUnauthorized(auth);

  const tenant = portalTenant(auth.session);
  const client = await getClientByPortalSlug(tenant.portalSlug);
  const submission = await getCtpSubmissionForPortal({
    portalSlug: tenant.portalSlug,
    email: auth.session.email ?? client?.email,
  });

  if (!submission) {
    return NextResponse.json({ ok: true, submission: null });
  }

  return NextResponse.json({
    ok: true,
    submission: buildCtpPortalStatusView(submission),
  });
}
