import { createHash } from 'node:crypto';
import { airtableQuery, airtableUpdate, airtableUpsertByField } from '@/lib/data/airtable-client';
import { loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';

/** Legacy public registration payload stays valid. New fields are optional for that caller. */
export type TrackingLead = {
  first_name: string; last_name: string; name?: string; email: string; phone: string;
  client_id?: string; brick_type?: string;
  class_name: string; class_id: string; registration_type: 'live' | 'waitlist';
  created_at: string; source_page: string;
  registration_id?: string; payment_status?: 'unpaid' | 'paid';
  payment_reference?: string | null; timestamp?: string; source?: string;
  is_test?: boolean; event_type?: 'signup';
};
export type TrackingPayment = {
  event_type: 'payment_confirmed'; registration_id?: string;
  email: string; class_id: string; payment_status: 'paid';
  payment_reference: string; payment_provider: 'square' | 'stripe';
  timestamp: string; is_test?: boolean; client_id?:string;
};

function registrationKey(email: string, course: string, clientId='amanda-catherine', registrationId?:string) {
  const original=email.trim().toLowerCase() + ':' + course;
  // Preserve Amanda's existing enrollment identity, but allow multiple bookings
  // of one generic brick for the same customer without overwriting the first.
  return clientId==='amanda-catherine'?original:clientId+':'+(registrationId || original);
}
function testRecordId(registrationId: string, clientId='amanda-catherine') {
  return 'amanda-tracking-test-' + createHash('sha256').update(clientId==='amanda-catherine'?registrationId:clientId+':'+registrationId).digest('hex').slice(0, 32);
}
function escapeFormula(value: string) { return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
function stableId(key: string) { return createHash('sha256').update(key).digest('hex').slice(0, 32); }
function normalizeLead(input: TrackingLead): TrackingLead {
  const email = input.email.trim().toLowerCase();
  return { ...input, email, name: input.name || [input.first_name,input.last_name].filter(Boolean).join(' '), registration_id: input.registration_id || stableId(registrationKey(email, input.class_id, input.client_id, input.registration_id)),
    payment_status: input.payment_status || 'unpaid', payment_reference: input.payment_reference ?? null,
    timestamp: input.timestamp || input.created_at, source: input.source || input.source_page,
    event_type: 'signup', is_test: input.is_test === true };
}
async function saveTestLead(lead: TrackingLead) {
  const id = testRecordId(lead.registration_id!,lead.client_id);
  const saved = await saveStudioRecord({recordType:'experience',id,
    organizationId:syntheticOrgId(lead.client_id||'amanda-catherine'),title:'[TEST] Brick tracking signup',
    payload:{...lead, is_test:true, record_kind:'amanda_tracking_test'}});
  if (!saved.ok || !saved.persistedToAirtable) throw new Error(saved.error || 'Test registration not saved');
  return {ok:true,id};
}
export async function saveTrackingLead(lead: TrackingLead) {
  if (lead.is_test) return saveTestLead(lead);
  const key = registrationKey(lead.email, lead.class_id,lead.client_id,lead.registration_id);
  // Legacy fields remain the compatibility baseline for the existing Airtable schema.
  const current = await airtableQuery('portal_registrations',{
    filterByFormula:"{registration_key}='"+escapeFormula(key)+"'",maxRecords:1});
  const existingPayment = String(current[0]?.fields?.payment_status || '');
  const fields = {registration_key:key,first_name:lead.first_name,last_name:lead.last_name,
    email:lead.email,phone:lead.phone,class_name:lead.class_name,class_id:lead.class_id,
    registration_type:lead.registration_type,created_at:lead.created_at,source_page:lead.source_page,
    registration_id:lead.registration_id,payment_status:existingPayment === 'paid' ? 'paid' : lead.payment_status,
    payment_reference:existingPayment === 'paid' ? String(current[0]?.fields?.payment_reference || '') : (lead.payment_reference || ''),source:lead.source};
  const record = await airtableUpsertByField('portal_registrations','registration_key',key,fields);
  if (!record) throw new Error('Tracking portal registration could not be saved');
  // Extended payment metadata lives in a deterministic record, not in an unverified Airtable schema.
  const id = 'amanda-tracking-meta-' + stableId(key);
  const existing = await loadStudioRecord<TrackingLead>('experience',id);
  const saved = await saveStudioRecord({recordType:'experience',id,
    organizationId:syntheticOrgId(lead.client_id||'amanda-catherine'),title:'Brick tracking metadata',
    payload:{...existing,...lead,registration_id:existing?.registration_id || lead.registration_id,
      payment_status:existing?.payment_status==='paid'?'paid':lead.payment_status,
      payment_reference:existing?.payment_status==='paid'?existing.payment_reference:lead.payment_reference}});
  if (!saved.ok || !saved.persistedToAirtable) throw new Error(saved.error || 'Tracking metadata could not be saved');
  return {ok:true,id:record.id};
}
async function postIngest(payload: TrackingLead | TrackingPayment) {
  const url = process.env.TRACKING_PORTAL_API_URL?.trim() || process.env.TRACKING_PORTAL_URL?.trim();
  const apiKey = process.env.TRACKING_PORTAL_API_KEY?.trim() || process.env.INGEST_API_KEY?.trim();
  if (!url || !apiKey) return false;
  const response = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey},
    body:JSON.stringify(payload),cache:'no-store',signal:AbortSignal.timeout(10000)});
  const body = await response.json().catch(()=>({}));
  if (!response.ok || !body.ok) throw new Error(body.error || 'Tracking ingest returned ' + response.status);
  return true;
}
export async function pushToTrackingPortal(input: TrackingLead) {
  const lead = normalizeLead(input);
  // Test events cannot enter the production portal_registrations table or a remote ingest.
  const remote = lead.is_test ? false : await postIngest(lead);
  const result = remote ? {ok:true} : await saveTrackingLead(lead);
  if (!lead.is_test) {
    const key = registrationKey(lead.email,lead.class_id,lead.client_id,lead.registration_id);
    // The retry journal is best-effort; a journal failure must not replay an accepted signup.
    try { await airtableUpsertByField('tracking_sync_failures','failure_key',key,{
      failure_key:key,payload_json:JSON.stringify(lead),status:'synced',attempts:0,last_error:'',
      next_retry_at:new Date().toISOString(),updated_at:new Date().toISOString()}); }
    catch(error) { console.error('[amanda-tracking] journal failed',error); }
  }
  return result;
}
export async function storeTrackingPayment(event: TrackingPayment) {
  if (event.payment_status !== 'paid' || !event.payment_reference) throw new Error('Verified payment required');
  if (event.is_test) {
    if (!event.registration_id) throw new Error('Test registration ID required');
    const id = testRecordId(event.registration_id,event.client_id);
    const lead = await loadStudioRecord<TrackingLead>('experience',id);
    if (!lead || !lead.is_test || lead.email !== event.email.toLowerCase() || lead.class_id !== event.class_id) {
      throw new Error('Matching test registration not found');
    }
    if (lead.payment_status === 'paid' && lead.payment_reference !== event.payment_reference) throw new Error('Conflicting test payment');
    const saved = await saveStudioRecord({recordType:'experience',id,
      organizationId:syntheticOrgId(event.client_id||'amanda-catherine'),title:'[TEST] Brick tracking PAID',
      payload:{...lead,payment_status:'paid',payment_reference:event.payment_reference,
        payment_provider:event.payment_provider,paid_at:event.timestamp,is_test:true}});
    if (!saved.ok || !saved.persistedToAirtable) throw new Error(saved.error || 'Test payment tracking failed');
    return {ok:true,id,alreadyPaid:lead.payment_status==='paid'};
  }
  const key = registrationKey(event.email,event.class_id,event.client_id,event.registration_id);
  const rows = await airtableQuery('portal_registrations',{
    filterByFormula:"{registration_key}='" + escapeFormula(key) + "'",maxRecords:1});
  if (!rows[0]) throw new Error('Matching live registration not found; payment was not matched');
  const id = 'amanda-tracking-meta-' + stableId(key);
  const lead = await loadStudioRecord<TrackingLead & {payment_provider?:string}>('experience',id);
  if (lead?.payment_status === 'paid' && lead.payment_reference !== event.payment_reference) throw new Error('Conflicting payment reference');
  const updated = await airtableUpdate('portal_registrations',rows[0].id,{
    payment_status:'paid',payment_reference:event.payment_reference,
    payment_provider:event.payment_provider,paid_at:event.timestamp,
    registration_id:lead?.registration_id || event.registration_id || stableId(key),
  });
  if (!updated) throw new Error('Existing tracking registration could not be marked paid');
  const saved = await saveStudioRecord({recordType:'experience',id,
    organizationId:syntheticOrgId(event.client_id||'amanda-catherine'),title:'Brick tracking PAID',
    payload:{...lead,registration_id:lead?.registration_id || event.registration_id || stableId(key),
      email:event.email.toLowerCase(),class_id:event.class_id,payment_status:'paid',
      payment_reference:event.payment_reference,payment_provider:event.payment_provider,paid_at:event.timestamp,is_test:false}});
  if (!saved.ok || !saved.persistedToAirtable) throw new Error(saved.error || 'Verified payment metadata could not be saved');
  return {ok:true,id,alreadyPaid:lead?.payment_status==='paid'};
}
export async function confirmTrackingPayment(event: TrackingPayment) {
  if (event.is_test) return storeTrackingPayment(event);
  const remote = await postIngest(event);
  return remote ? {ok:true} : storeTrackingPayment(event);
}
export async function enqueueTrackingPortalRetry(data: TrackingLead,error:unknown) {
  const key=registrationKey(data.email,data.class_id);
  const message=error instanceof Error?error.message:'Unknown tracking sync error';
  const record=await airtableUpsertByField('tracking_sync_failures','failure_key',key,{
    failure_key:key,payload_json:JSON.stringify(data),status:'pending',attempts:0,last_error:message.slice(0,1000),
    next_retry_at:new Date(Date.now()+5*60*1000).toISOString(),created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
  if (!record) throw new Error('Tracking retry could not be queued');
}
export async function getTestTrackingRegistration(id:string) {
  if (!/^[a-zA-Z0-9_-]{8,120}$/.test(id)) return null;
  return loadStudioRecord<TrackingLead & {paid_at?:string}>('experience',testRecordId(id));
}
