import { NextRequest, NextResponse } from 'next/server';
import { getClientByPortalSlug } from '@/lib/airtable';
import { guardPortalApiCookie, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import {
  applyCtpDesignStudioInput,
  normalizeDesignStudioInput,
} from '@/lib/ctp-design-studio';
import { buildCtpPortalStatusView } from '@/lib/ctp-portal-status';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';

export const dynamic = 'force-dynamic';

/** Save Design Studio brand fields / assets for the authenticated portal CTP. */
export async function POST(req: NextRequest) {
  const auth = await guardPortalApiCookie();
  if (!auth.ok) return portalApiUnauthorized(auth);

  const tenant = portalTenant(auth.session);
  const client = await getClientByPortalSlug(tenant.portalSlug);
  const submission = await getCtpSubmissionForPortal({
    portalSlug: tenant.portalSlug,
    email: auth.session.email ?? client?.email,
  });

  if (!submission) {
    return NextResponse.json({ ok: false, error: 'No CTP submission for this portal.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const input = normalizeDesignStudioInput(body);
  const result = await applyCtpDesignStudioInput(submission.id, input);
  if (!result.ok || !result.submission) {
    return NextResponse.json(
      { ok: false, error: result.error ?? 'Could not save Design Studio inputs.' },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    submission: buildCtpPortalStatusView(result.submission),
  });
}
