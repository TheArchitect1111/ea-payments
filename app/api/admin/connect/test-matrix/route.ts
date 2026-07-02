import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuthJsonError, requireAdminAction } from '@/lib/admin-session-guard';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { buildConnectTestMatrix } from '@/lib/connect-test-matrix';
import { seedConnectTestRelationships } from '@/lib/connect-store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function requireAdminManage() {
  const cookieStore = await cookies();
  return requireAdminAction(cookieStore.get(EA_ADMIN_COOKIE)?.value, 'admin:manage');
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminManage();
  if (!auth.ok) return adminAuthJsonError(auth);

  const orgSlug = request.nextUrl.searchParams.get('org')?.trim() || 'demo-client';
  const matrix = await buildConnectTestMatrix(orgSlug);
  return NextResponse.json({ ok: matrix.score === 100, matrix });
}

/** Seeds synthetic capture records for running the 20-step Connect matrix quickly. */
export async function POST(request: NextRequest) {
  const auth = await requireAdminManage();
  if (!auth.ok) return adminAuthJsonError(auth);

  let body: { orgSlug?: string; count?: number; tag?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // defaults below
  }

  const orgSlug = body.orgSlug?.trim() || 'demo-client';
  const count = Number.isFinite(body.count) ? Math.max(1, Math.min(50, Number(body.count))) : 20;
  const seeded = await seedConnectTestRelationships({
    orgSlug,
    count,
    tag: body.tag?.trim() || 'matrix',
  });
  const matrix = await buildConnectTestMatrix(orgSlug);

  return NextResponse.json({
    ok: true,
    seeded: seeded.length,
    orgSlug,
    sampleEmails: seeded.slice(0, 3).map((item) => item.email),
    matrix,
  });
}
