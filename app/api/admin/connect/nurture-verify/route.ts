import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuthJsonError, requireAdminAction } from '@/lib/admin-session-guard';
import { logConnectNurtureRun } from '@/lib/connect-nurture-log';
import { processDueConnectSequences } from '@/lib/connect-sequence-runner';
import { seedNurtureVerificationRelationship } from '@/lib/connect-store';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const auth = await requireAdminAction(cookieStore.get(EA_ADMIN_COOKIE)?.value, 'admin:manage');
  if (!auth.ok) return adminAuthJsonError(auth);

  let orgSlug = 'demo-client';
  try {
    const body = (await request.json()) as { orgSlug?: string };
    if (body.orgSlug?.trim()) orgSlug = body.orgSlug.trim();
  } catch {
    // default org
  }

  try {
    const relationship = await seedNurtureVerificationRelationship(orgSlug);
    const result = await processDueConnectSequences();
    const run = await logConnectNurtureRun(result, 'admin-verify', {
      tenantId: orgSlug,
      objectId: relationship.id,
      note: relationship.email,
    });

    return NextResponse.json({
      ok: result.errors.length === 0,
      orgSlug,
      relationship: {
        id: relationship.id,
        email: relationship.email,
        createdAt: relationship.createdAt,
        sequenceSent: relationship.sequenceSent,
      },
      nurture: result,
      lastRun: run,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nurture verification failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
