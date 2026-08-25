import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import {
  buildClientContext,
  createClientProfile,
  getClientProfile,
  listClientProfiles,
  saveClientProfile,
  type ClientContextProfile,
} from '@/lib/client-context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const clientId = req.nextUrl.searchParams.get('clientId')?.trim();
  if (!clientId) {
    return NextResponse.json({ ok: true, profiles: await listClientProfiles() });
  }

  const context = await buildClientContext(clientId);
  if (!context) return NextResponse.json({ error: 'Client Context not found.' }, { status: 404 });
  return NextResponse.json({ ok: true, context });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Partial<ClientContextProfile> & { organizationName?: string; clientId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const organizationName = String(body.organizationName || '').trim();
  if (!organizationName) return NextResponse.json({ error: 'organizationName is required.' }, { status: 400 });

  const existing = body.clientId ? await getClientProfile(body.clientId) : null;
  const profile = createClientProfile({
    ...(existing ?? {}),
    ...body,
    organizationName,
    createdAt: existing?.createdAt ?? body.createdAt,
  });
  const saved = await saveClientProfile(profile);
  if (!saved.ok) return NextResponse.json({ error: saved.error || 'Unable to save Client Context.' }, { status: 500 });

  return NextResponse.json({ ok: true, profile: saved.profile, context: await buildClientContext(saved.profile.clientId) });
}
