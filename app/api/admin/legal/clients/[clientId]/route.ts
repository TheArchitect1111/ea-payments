import { NextRequest, NextResponse } from 'next/server';
import { guardAdminApi, adminApiUnauthorized } from '@/lib/api/admin-route';
import { getClientLegalProfile } from '@/lib/trust-engine/client-store';
import { getLegalAuditHistory } from '@/lib/trust-engine/audit';
import { buildClientLegalStatus } from '@/lib/trust-engine/status';

export const dynamic = 'force-dynamic';

/** GET /api/admin/legal/clients/[clientId] */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ clientId: string }> },
) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  const { clientId } = await ctx.params;
  const profile = await getClientLegalProfile(clientId);
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Client not found' }, { status: 404 });
  }

  const status = buildClientLegalStatus({ productId: profile.productId, profile });
  const audit = await getLegalAuditHistory({ clientId, limit: 100 });

  return NextResponse.json({
    ok: true,
    profile,
    status,
    audit,
    acceptanceHistory: profile.acceptanceHistory,
  });
}
