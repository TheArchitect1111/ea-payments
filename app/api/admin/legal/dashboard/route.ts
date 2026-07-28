import { NextRequest, NextResponse } from 'next/server';
import { guardAdminApi, adminApiUnauthorized } from '@/lib/api/admin-route';
import { getLegalExecutiveDashboard } from '@/lib/trust-engine/api';

export const dynamic = 'force-dynamic';

/** GET /api/admin/legal/dashboard */
export async function GET(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);
  const dashboard = await getLegalExecutiveDashboard();
  return NextResponse.json({ ok: true, dashboard });
}
