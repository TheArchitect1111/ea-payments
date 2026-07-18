import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import { clonePortalTenant } from '@/lib/portal-clone';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** Clone portal tenant: client, access, entitlements, Home site page. */
export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { sourceSlug?: string; clientName?: string; email?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const result = await clonePortalTenant({
    sourceSlug: String(body.sourceSlug || ''),
    clientName: body.clientName,
    email: body.email,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, warnings: result.warnings }, { status: 400 });
  }

  return NextResponse.json(result);
}
