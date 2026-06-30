import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getCaptureByIdentifier, updateOutcomeStatus, snoozeActiveSave } from '@/lib/capture-records';
import {
  OUTCOME_LABELS,
  nextActionForOutcome,
  type OutcomeStatus,
} from '@/lib/outcome-tracking';
import { notifyPortal } from '@/lib/portal-notify';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Please log in again.' }, { status: 401 });
  }

  const body = (await req.json()) as {
    recordId?: string;
    outcome?: OutcomeStatus;
    action?: 'snooze';
    days?: number;
  };

  const recordId = body.recordId?.trim();
  if (!recordId) {
    return NextResponse.json({ ok: false, error: 'Record ID required.' }, { status: 400 });
  }

  const record = await getCaptureByIdentifier(recordId);
  if (!record) {
    return NextResponse.json({ ok: false, error: 'Capture not found.' }, { status: 404 });
  }

  if (record.portalSlug && record.portalSlug !== session.slug) {
    return NextResponse.json({ ok: false, error: 'Not authorized.' }, { status: 403 });
  }

  if (body.action === 'snooze') {
    const days = body.days ?? 30;
    const due = new Date();
    due.setDate(due.getDate() + days);
    const dueDate = due.toISOString().slice(0, 10);
    const updated = await snoozeActiveSave(recordId, dueDate);
    if (!updated.ok) {
      return NextResponse.json({ ok: false, error: updated.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, dueDate });
  }

  const outcome = body.outcome;
  if (!outcome || !OUTCOME_LABELS[outcome]) {
    return NextResponse.json({ ok: false, error: 'Valid outcome required.' }, { status: 400 });
  }

  const label = OUTCOME_LABELS[outcome];
  const nextAction = nextActionForOutcome(outcome);
  const status = outcome === 'lost' || outcome === 'passed' ? 'Archived' : record.status;

  const updated = await updateOutcomeStatus(recordId, {
    outcomeStatus: label,
    nextAction,
    status: status as typeof record.status,
  });

  if (!updated.ok) {
    return NextResponse.json({ ok: false, error: updated.error }, { status: 500 });
  }

  await notifyPortal({
    product: 'simplifi',
    type: 'capture.outcome_recorded',
    title: `${record.title} → ${label}`,
    detail: nextAction,
    href: `/portal/${session.slug}/simplifi`,
    objectId: recordId,
    tenantId: session.slug,
    priority: outcome === 'won' ? 'high' : 'medium',
  });

  return NextResponse.json({ ok: true, outcomeStatus: label, nextAction });
}
