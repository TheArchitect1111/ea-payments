import { NextRequest, NextResponse } from 'next/server';
import { requirePortalSessionFromRequest } from '@/lib/auth/resolve-portal-session';
import { resolveCaptureTenant } from '@/lib/bricks/capture-entry-bridge';
import { readAyfClientHandoff } from '@/lib/ayf/handoff';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ submissionId: string }> }
) {
  const session = await requirePortalSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (session.slug !== 'are-you-fundable' || !session.orgId || !session.email) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const tenant = await resolveCaptureTenant('are-you-fundable', 'intake');

  if (!tenant) {
    return NextResponse.json({ error: 'AYF portal unavailable' }, { status: 503 });
  }

  const { submissionId } = await context.params;

  try {
    const handoff = await readAyfClientHandoff(
      tenant,
      submissionId,
      session
    );

    if (handoff.portalAccess !== 'verified') {
      return NextResponse.json({ error: 'Portal access pending' }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      submissionId: handoff.submissionId,
      portalAccess: handoff.portalAccess,
      emailStatus: handoff.delivery
    });
  } catch {
    return NextResponse.json({ error: 'Record unavailable' }, { status: 404 });
  }
}
