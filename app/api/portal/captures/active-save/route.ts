import { NextResponse } from 'next/server';
import { guardPortalApiCookie, portalApiUnauthorized } from '@/lib/api/portal-route';
import { getClientByPortalSlug } from '@/lib/airtable';
import {
  defaultDueDateForPurpose,
  getActiveSavePurpose,
  type ActiveSavePurpose,
} from '@/lib/active-save';
import { getCaptureByIdentifier, updateActiveSave } from '@/lib/capture-records';
import { notifyPortal } from '@/lib/portal-notify';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await guardPortalApiCookie({ realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const session = auth.session;

  const client = await getClientByPortalSlug(session.slug);
  if (!client) {
    return NextResponse.json({ ok: false, error: 'Client record not found.' }, { status: 404 });
  }

  const body = (await req.json()) as {
    recordId?: string;
    purpose?: ActiveSavePurpose;
    reason?: string;
    dueDate?: string;
  };

  const recordId = body.recordId?.trim();
  const purpose = body.purpose;
  if (!recordId || !purpose) {
    return NextResponse.json({ ok: false, error: 'Record and purpose are required.' }, { status: 400 });
  }

  const option = getActiveSavePurpose(purpose);
  if (!option) {
    return NextResponse.json({ ok: false, error: 'Invalid save purpose.' }, { status: 400 });
  }

  const record = await getCaptureByIdentifier(recordId);
  if (!record) {
    return NextResponse.json({ ok: false, error: 'Capture not found.' }, { status: 404 });
  }

  if (record.portalSlug && record.portalSlug !== session.slug) {
    return NextResponse.json({ ok: false, error: 'Not authorized for this capture.' }, { status: 403 });
  }

  const dueDate = body.dueDate?.trim() || defaultDueDateForPurpose(purpose);
  const updated = await updateActiveSave(recordId, {
    savePurpose: option.label,
    saveReason: body.reason?.trim(),
    dueDate,
    nextAction: option.nextAction,
  });

  if (!updated.ok) {
    return NextResponse.json({ ok: false, error: updated.error }, { status: 500 });
  }

  await notifyPortal({
    product: 'simplifi',
    type: 'capture.active_saved',
    title: record.title,
    detail: `${option.label} · due ${dueDate}`,
    href: `/portal/${session.slug}/simplifi`,
    objectId: recordId,
    tenantId: session.slug,
    priority: 'medium',
  });

  return NextResponse.json({
    ok: true,
    savePurpose: option.label,
    dueDate,
    nextAction: option.nextAction,
  });
}
