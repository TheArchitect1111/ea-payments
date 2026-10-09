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

export async function pushToTrackingPortal(data: TrackingLead) {
  const url = process.env.TRACKING_PORTAL_URL?.trim();
  const apiKey = process.env.TRACKING_PORTAL_API_KEY?.trim();
  if (!url || !apiKey) throw new Error('Tracking portal connection is not configured.');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify(data),
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.error || `Tracking portal returned ${response.status}`);
  const failureKey = `${data.email.toLowerCase()}:${data.class_id}`;
  await airtableUpsertByField('tracking_sync_failures', 'failure_key', failureKey, {
    failure_key: failureKey,
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
  const failureKey = `${data.email.toLowerCase()}:${data.class_id}`;
  const message = error instanceof Error ? error.message : 'Unknown tracking sync error';
  const record = await airtableUpsertByField('tracking_sync_failures', 'failure_key', failureKey, {
    failure_key: failureKey,
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
