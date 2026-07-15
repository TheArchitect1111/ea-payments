import { NextRequest, NextResponse } from 'next/server';
import { getClientByPortalSlug } from '@/lib/airtable';
import { guardPortalApiCookie, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import {
  applyCtpDesignStudioInput,
  completeCtpDesignStudio,
  normalizeDesignStudioInput,
} from '@/lib/ctp-design-studio';
import { buildCtpPortalStatusView } from '@/lib/ctp-portal-status';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';

export const dynamic = 'force-dynamic';

/** Save Design Studio brand fields / assets, or mark complete for founder review. */
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

  const action =
    body && typeof body === 'object' && 'action' in body
      ? String((body as { action?: unknown }).action ?? '')
      : '';

  if (action === 'complete') {
    const result = await completeCtpDesignStudio(submission.id);
    if (!result.ok || !result.submission) {
      return NextResponse.json(
        { ok: false, error: result.error ?? 'Could not mark Design Studio complete.' },
        { status: 400 },
      );
    }
    return NextResponse.json({
      ok: true,
      completed: true,
      submission: buildCtpPortalStatusView(result.submission),
    });
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
