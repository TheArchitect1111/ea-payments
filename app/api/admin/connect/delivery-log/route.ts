import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuthJsonError, requireAdminAction } from '@/lib/admin-session-guard';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { getConnectDeliveryStatus, listConnectDeliveries } from '@/lib/connect-delivery-log';

export const dynamic = 'force-dynamic';

async function requireAdminManage() {
  const cookieStore = await cookies();
  return requireAdminAction(cookieStore.get(EA_ADMIN_COOKIE)?.value, 'admin:manage');
}

/** Verified Connect delivery log (email, SMS, webhook, staff notices). */
export async function GET(request: NextRequest) {
  const auth = await requireAdminManage();
  if (!auth.ok) return adminAuthJsonError(auth);

  const orgSlug = request.nextUrl.searchParams.get('org')?.trim() || undefined;
  const status = await getConnectDeliveryStatus(orgSlug);
  const recent = await listConnectDeliveries(orgSlug, 30);

  return NextResponse.json({
    ok: status.recentFailures.length === 0,
    orgSlug: orgSlug ?? 'all',
    ...status,
    recent,
  });
}
