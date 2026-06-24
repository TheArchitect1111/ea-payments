import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { ensureConnectTenantStorage, getConnectSystemStatus } from '@/lib/connect-store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(EA_ADMIN_COOKIE)?.value);
  return Boolean(session);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }

  const status = await getConnectSystemStatus();
  return NextResponse.json(status);
}

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }

  try {
    const setup = await ensureConnectTenantStorage();
    const status = await getConnectSystemStatus();
    return NextResponse.json({ setup, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to set up Connect storage.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
