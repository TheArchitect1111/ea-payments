import { NextResponse } from 'next/server';
import {
  EA_ADMIN_COOKIE,
  parseAdminSession,
  type AdminSessionUser,
} from '@/lib/ea-admin-auth';
import {
  can,
  normalizeAdminRole,
  requireRole,
  type PlatformAction,
  type PlatformRole,
} from '@/lib/rbac';

export function getAdminSession(token: string | undefined): AdminSessionUser | null {
  return parseAdminSession(token);
}

export function getAdminRole(session: AdminSessionUser | null): PlatformRole {
  if (!session) return 'guest';
  return normalizeAdminRole(session.role);
}

export function adminCan(
  session: AdminSessionUser | null,
  action: PlatformAction,
): boolean {
  return can(getAdminRole(session), action);
}

export function requireAdminSession(
  token: string | undefined,
): { ok: true; user: AdminSessionUser } | { ok: false; status: number; error: string } {
  const user = parseAdminSession(token);
  if (!user) {
    return { ok: false, status: 401, error: 'Admin authentication required.' };
  }

  const role = normalizeAdminRole(user.role);
  const gate = requireRole(role, 'admin:access');
  if (!gate.ok) {
    return { ok: false, status: 403, error: gate.error };
  }

  return { ok: true, user };
}

export function requireAdminAction(
  token: string | undefined,
  action: PlatformAction,
): { ok: true; user: AdminSessionUser } | { ok: false; status: number; error: string } {
  const base = requireAdminSession(token);
  if (!base.ok) return base;

  const role = normalizeAdminRole(base.user.role);
  const gate = requireRole(role, action);
  if (!gate.ok) {
    return { ok: false, status: 403, error: gate.error };
  }

  return { ok: true, user: base.user };
}

export function adminAuthJsonError(
  result: { ok: false; status: number; error: string },
): NextResponse {
  return NextResponse.json({ error: result.error }, { status: result.status });
}

export function readAdminTokenFromCookie(
  cookieValue: string | undefined,
): string | undefined {
  return cookieValue;
}

export { EA_ADMIN_COOKIE };
