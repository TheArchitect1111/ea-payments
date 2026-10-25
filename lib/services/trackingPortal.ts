import clientRegistry from '@/lib/clients/registry.json';
import type {BrickInteractionEvent} from './brickRegistrar';
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
  // Explicit signup identity isolates repeat purchases; legacy callers keep their old key.
  const legacyAmandaId=clientId==='amanda-catherine'&&registrationId===stableId(original);
  return registrationId&&!legacyAmandaId?clientId+':'+registrationId:clientId==='amanda-catherine'?original:clientId+':'+original;
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
  if(current[0]&&(String(current[0].fields.email).toLowerCase()!==lead.email||current[0].fields.class_id!==lead.class_id))throw new Error('Conflicting signup identity');
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
  const remote = lead.is_test || (lead.client_id && lead.client_id !== 'amanda-catherine') ? false : await postIngest(lead);
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
  let key = registrationKey(event.email,event.class_id,event.client_id,event.registration_id);
  let rows = await airtableQuery('portal_registrations',{
    filterByFormula:"{registration_key}='" + escapeFormula(key) + "'",maxRecords:1});
  if(!rows[0]&&event.registration_id&&(!event.client_id||event.client_id==='amanda-catherine')){
    const legacyKey=event.email.trim().toLowerCase()+':'+event.class_id;
    const legacy=await airtableQuery('portal_registrations',{filterByFormula:"{registration_key}='"+escapeFormula(legacyKey)+"'",maxRecords:1});
    if(legacy[0]?.fields.registration_id===event.registration_id){key=legacyKey;rows=legacy;}
  }
  if (!rows[0]||String(rows[0].fields.email).toLowerCase()!==event.email.toLowerCase()||rows[0].fields.class_id!==event.class_id) throw new Error('Matching live registration not found; payment was not matched');
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
  const remote = event.client_id && event.client_id !== 'amanda-catherine' ? false : await postIngest(event);
  return remote ? {ok:true} : storeTrackingPayment(event);
}
export async function enqueueTrackingPortalRetry(data: TrackingLead,error:unknown) {
  const key=registrationKey(data.email,data.class_id,data.client_id,data.registration_id);
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

/** Factory-generated portal entries share one registry with client event adapters. */
export const clientTrackingPortals: Record<string,{name:string;slug:string;portalPath:string;eventAdapter:string}>=clientRegistry;
export function getClientTrackingPortal(slug:string) {
 return Object.prototype.hasOwnProperty.call(clientTrackingPortals,slug)?clientTrackingPortals[slug]:null;
}

/** Canonical anonymous interaction sink, separate from contact registrations. */
export async function storeBrickInteraction(event:BrickInteractionEvent) {
 const id='amanda-click-'+event.event_id;
 if(event.is_test) {
  const saved=await saveStudioRecord({recordType:'experience',id,
   organizationId:syntheticOrgId('amanda-catherine'),title:'[TEST] Amanda CTA',
   payload:{...event,record_kind:'amanda_click_test'}});
  if(!saved.ok||!saved.persistedToAirtable)throw new Error(saved.error||'Test click not saved');
  return {id};
 }
 // Use Amanda's registry connection so writes and the Hub reader share one base.
 const {registry,table,airtable}=await import('@/lib/amanda-catherine/registry');
 let course: {key:string;title:string;price:number|null;square_checkout_url:string|null}|undefined;
 if(event.course_key){course=(await registry()).courses.find(item=>item.key===event.course_key);if(!course)throw new Error('Unknown Amanda course click');}
 const title=`${event.cta_name} — ${event.event_id}`;
 const values:Record<string,unknown>={Title:title,'CTA Name':event.cta_name,'Source Page':event.source,Timestamp:event.timestamp,
  Status:'CTA Clicked',Portal:'amanda-catherine','Portal Slug':'amanda-catherine',
  Event:'cta_click','Payload JSON':JSON.stringify(event),
  ...(course?{'Course Key':course.key,'Course Name':course.title,Price:course.price??undefined,'Square URL':course.square_checkout_url||undefined}:{})};
 const schema=await table('Business Interested');const fields:Record<string,unknown>={};
 for(const [key,value] of Object.entries(values)){if(value===undefined)continue;const field=schema.fields.find(item=>item.name===key);if(!field)throw new Error('Amanda tracking schema drift: '+key);fields[field.id]=value;}
 const result=await airtable('$base/'+schema.id,{method:'PATCH',body:JSON.stringify({performUpsert:{fieldsToMergeOn:['Title']},records:[{fields}],typecast:true})});
 const row=result.records?.[0];if(!row?.id)throw new Error('Amanda click could not be saved');
 return {id:row.id};
}
