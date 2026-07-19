import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import { runAdminShowProvision } from '@/lib/admin-show-provision';

export const dynamic = 'force-dynamic';

/** POST { businessName, email?, tagline? } — create portal + starter site for a phone show. */
export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { businessName?: string; email?: string; tagline?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const result = await runAdminShowProvision({
    businessName: String(body.businessName || ''),
    email: body.email,
    tagline: body.tagline,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Provision failed.' }, { status: 500 });
  }

  return NextResponse.json(result);
}
