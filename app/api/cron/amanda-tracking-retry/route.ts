import { NextRequest, NextResponse } from 'next/server';
import { airtableQuery, airtableUpdate } from '@/lib/data/airtable-client';
import { pushToTrackingPortal, type TrackingLead } from '@/lib/services/trackingPortal';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const due = await airtableQuery('tracking_sync_failures', {
    filterByFormula: "AND({status}='pending',{next_retry_at}<=NOW())",
    maxRecords: 25,
  });
  let synced = 0;
  let retried = 0;
  for (const record of due) {
    let payload: TrackingLead;
    try {
      payload = JSON.parse(String(record.fields.payload_json || '')) as TrackingLead;
      await pushToTrackingPortal(payload);
      await airtableUpdate('tracking_sync_failures', record.id, {
        status: 'synced', last_error: '', updated_at: new Date().toISOString(),
      });
      synced += 1;
    } catch (error) {
      const attempts = Number(record.fields.attempts || 0) + 1;
      const status = attempts >= 8 ? 'failed' : 'pending';
      await airtableUpdate('tracking_sync_failures', record.id, {
        attempts,
        status,
        last_error: error instanceof Error ? error.message.slice(0, 1000) : 'Unknown retry error',
        next_retry_at: new Date(Date.now() + Math.min(60, 5 * attempts) * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      });
      retried += 1;
    }
  }
  return NextResponse.json({ ok: true, checked: due.length, synced, retried, at: new Date().toISOString() });
}
