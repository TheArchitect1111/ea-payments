import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import { runAdminShowProvision } from '@/lib/admin-show-provision';

export const dynamic = 'force-dynamic';

/** POST presence + business fields — create portal + starter site for a phone show. */
export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: {
    businessName?: string;
    contactName?: string;
    email?: string;
    tagline?: string;
    websiteUrl?: string;
    imageUrl?: string;
    industry?: string;
    notes?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const result = await runAdminShowProvision({
    businessName: String(body.businessName || ''),
    contactName: body.contactName,
    email: body.email,
    tagline: body.tagline,
    websiteUrl: body.websiteUrl,
    imageUrl: body.imageUrl,
    industry: body.industry,
    notes: body.notes,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Provision failed.' }, { status: 500 });
  }

  return NextResponse.json(result);
}
