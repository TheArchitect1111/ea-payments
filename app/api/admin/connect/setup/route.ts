import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import {
  adminAuthJsonError,
  requireAdminAction,
  requireAdminSession,
} from '@/lib/admin-session-guard';
import { ensureConnectTenantStorage, getConnectSystemStatus } from '@/lib/connect-store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function requireAdminRead() {
  const cookieStore = await cookies();
  return requireAdminSession(cookieStore.get(EA_ADMIN_COOKIE)?.value);
}

async function requireAdminManage() {
  const cookieStore = await cookies();
  return requireAdminAction(cookieStore.get(EA_ADMIN_COOKIE)?.value, 'admin:manage');
}

export async function GET() {
  const auth = await requireAdminRead();
  if (!auth.ok) return adminAuthJsonError(auth);

  const status = await getConnectSystemStatus();
  return NextResponse.json(status);
}

export async function POST() {
  const auth = await requireAdminManage();
  if (!auth.ok) return adminAuthJsonError(auth);

  try {
    const setup = await ensureConnectTenantStorage();
    const status = await getConnectSystemStatus();
    return NextResponse.json({ setup, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to set up Connect storage.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
