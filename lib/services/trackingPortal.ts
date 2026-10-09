import { airtableUpsertByField } from '@/lib/data/airtable-client';

export type TrackingLead = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  class_name: string;
  class_id: string;
  registration_type: 'live' | 'waitlist';
  created_at: string;
  source_page: 'amandacatherine.ca';
};

function registrationKey(data: TrackingLead) {
  return `${data.email.toLowerCase()}:\${data.class_id}`;
}

async function saveTrackingLead(data: TrackingLead) {
  const key = registrationKey(data);
  const record = await airtableUpsertByField('portal_registrations', 'registration_key', key, {
    registration_key: key,
    ...data,
  });
  if (!record) throw new Error('Tracking portal registration could not be saved.');
  return { ok: true, id: record.id };
}

export async function pushToTrackingPortal(data: TrackingLead) {
  const url = process.env.TRACKING_PORTAL_URL?.trim();
  const apiKey = process.env.TRACKING_PORTAL_API_KEY?.trim();
  let result: { ok: boolean; id?: string };

  if (url && apiKey) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify(data),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) throw new Error(payload.error || `Tracking portal returned ${response.status}`);
    result = payload;
  } else {
    // Both Amanda’s site and her EVA portal currently share the EA Airtable base.
    // Persist directly to the portal table until an external ingest URL/key is configured.
    result = await saveTrackingLead(data);
  }

  const key = registrationKey(data);
  await airtableUpsertByField('tracking_sync_failures', 'failure_key', key, {
    failure_key: key,
    payload_json: JSON.stringify(data),
    status: 'synced',
    attempts: 0,
    last_error: '',
    next_retry_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  return result;
}

export async function enqueueTrackingPortalRetry(data: TrackingLead, error: unknown) {
  const key = registrationKey(data);
  const message = error instanceof Error ? error.message : 'Unknown tracking sync error';
  const record = await airtableUpsertByField('tracking_sync_failures', 'failure_key', key, {
    failure_key: key,
    payload_json: JSON.stringify(data),
    status: 'pending',
    attempts: 0,
    last_error: message.slice(0, 1000),
    next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (!record) throw new Error('Tracking retry could not be queued.');
}
