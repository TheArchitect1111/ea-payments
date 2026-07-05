import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { runCtpWorkspaceProvision } from '@/lib/ctp-workspace-provision';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  const { id } = await context.params;
  const submissionId = decodeURIComponent(id).trim();
  if (!submissionId) {
    return NextResponse.json({ ok: false, error: 'Submission ID required.' }, { status: 400 });
  }

  const result = await runCtpWorkspaceProvision(submissionId);
  if (!result.ok) {
    const status = result.error?.includes('not found')
      ? 404
      : result.error?.includes('in progress')
        ? 409
        : 502;
    return NextResponse.json(
      { ok: false, error: result.error ?? 'Workspace provisioning failed.' },
      { status },
    );
  }

  return NextResponse.json({ ok: true, portalSlug: result.portalSlug });
}
