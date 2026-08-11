import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { listExceptions, resolveException, type ExceptionStatus } from '@/lib/creative-studio/exception-queue';

export const dynamic = 'force-dynamic';

const VALID_STATUS = new Set<ExceptionStatus>(['open', 'acknowledged', 'resolved', 'dismissed']);

export async function GET(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);
  const orgId = process.env.EA_INTERNAL_ORG_ID ?? 'ea';
  const statusFilter = req.nextUrl.searchParams.get('status');
  const status = statusFilter && VALID_STATUS.has(statusFilter as ExceptionStatus)
    ? (statusFilter as ExceptionStatus)
    : undefined;
  const exceptions = await listExceptions(orgId, status);
  return NextResponse.json({ ok: true, exceptions });
}

export async function PATCH(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    status?: ExceptionStatus;
    note?: string;
  };

  if (!body.id || !body.status || body.status === 'open') {
    return NextResponse.json({ ok: false, error: 'id and a valid non-open status are required.' }, { status: 400 });
  }

  const orgId = process.env.EA_INTERNAL_ORG_ID ?? 'ea';
  const exception = await resolveException(orgId, body.id, {
    status: body.status,
    resolvedBy: auth.user.name,
    note: body.note,
  });

  if (!exception) return NextResponse.json({ ok: false, error: 'Exception not found.' }, { status: 404 });
  return NextResponse.json({ ok: true, exception });
}
