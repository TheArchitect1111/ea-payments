import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { EA_ADMIN_COOKIE, parseAdminSession, verifyAdminSession } from '@/lib/ea-admin-auth';
import {
  createConnectProfile,
  getConnectProfileById,
  listConnections,
  listConnectProfiles,
  updateConnectProfile,
} from '@/lib/connect-store';
import { validateConnectProfileBody } from '@/lib/connect-validation';

export const dynamic = 'force-dynamic';

async function adminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  return parseAdminSession(token);
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  return verifyAdminSession(token);
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get('type') || 'dashboard';
  if (type === 'profiles') {
    return NextResponse.json({ ok: true, profiles: await listConnectProfiles() });
  }

  if (type === 'profile') {
    const id = req.nextUrl.searchParams.get('id') || '';
    if (!id) return NextResponse.json({ ok: false, error: 'Profile id is required.' }, { status: 400 });
    return NextResponse.json({ ok: true, profile: await getConnectProfileById(id) });
  }

  const [connections, profiles] = await Promise.all([listConnections(200), listConnectProfiles()]);
  const today = new Date().toISOString().slice(0, 10);
  return NextResponse.json({
    ok: true,
    connections,
    profiles,
    stats: {
      today: connections.filter((item) => item.createdAt.slice(0, 10) === today).length,
      total: connections.length,
      highPriority: connections.filter((item) => item.aiPriority === 'High').length,
      partialAutomations: connections.filter((item) => item.automationStatus.startsWith('partial')).length,
    },
  });
}

export async function POST(req: NextRequest) {
  const user = await adminUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const validation = validateConnectProfileBody(body, user.email);
  if (!validation.ok) return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });

  const result = await createConnectProfile(validation.input);
  if (!result.ok) return NextResponse.json(result, { status: 500 });
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const user = await adminUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const id = String(body.id ?? '').trim();
  if (!id) return NextResponse.json({ ok: false, error: 'Profile id is required.' }, { status: 400 });

  const validation = validateConnectProfileBody(body, user.email);
  if (!validation.ok) return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });

  const result = await updateConnectProfile(id, validation.input);
  if (!result.ok) return NextResponse.json(result, { status: 500 });
  return NextResponse.json(result);
}
