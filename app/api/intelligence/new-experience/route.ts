import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { planNewExperience, type EACaptureInput } from '@/lib/ea-intelligence';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const body = (await req.json()) as {
    goals?: string[];
    audience?: string[];
    organizationType?: string;
    notes?: string;
    materials?: EACaptureInput[];
  };

  const goals = Array.isArray(body.goals) ? body.goals.map((item) => String(item).trim()).filter(Boolean) : [];
  const audience = Array.isArray(body.audience) ? body.audience.map((item) => String(item).trim()).filter(Boolean) : [];

  if (goals.length === 0 || audience.length === 0) {
    return NextResponse.json({ ok: false, error: 'Choose at least one goal and one audience.' }, { status: 400 });
  }

  const plan = planNewExperience({
    goals,
    audience,
    organizationType: body.organizationType?.trim(),
    notes: body.notes?.trim(),
    materials: body.materials,
  });

  return NextResponse.json({ ok: true, plan });
}
