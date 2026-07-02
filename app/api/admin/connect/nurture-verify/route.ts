import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuthJsonError, requireAdminAction } from '@/lib/admin-session-guard';
import { recordConnectNurtureRun } from '@/lib/connect-nurture-log';
import { processDueConnectSequences } from '@/lib/connect-sequence-runner';
import { seedNurtureVerificationRelationship } from '@/lib/connect-store';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { emitPulseEvent } from '@/lib/pulse-bus';

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
    const run = recordConnectNurtureRun({ ...result, trigger: 'admin-verify' });

    await emitPulseEvent({
      product: 'simplifi',
      type: 'capture.completed',
      title: 'Connect nurture verify',
      detail: `${relationship.email} · sent ${result.sent}`,
      priority: result.sent ? 'low' : 'medium',
      tenantId: orgSlug,
      objectId: relationship.id,
      metadata: {
        processed: result.processed,
        sent: result.sent,
        skipped: result.skipped,
        errors: result.errors.length,
      },
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
