import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionFromRequest } from '@/lib/admin-session-guard';
import { getWebsitePortalReadiness } from '@/lib/website-portal-readiness';

export const dynamic = 'force-dynamic';

/** GET /api/admin/website-portal/readiness — launch desk status for Website + Portal Starter. */
export async function GET(req: NextRequest) {
  const auth = await requireAdminSessionFromRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const readiness = await getWebsitePortalReadiness();
  return NextResponse.json({ ok: true, ...readiness });
}
