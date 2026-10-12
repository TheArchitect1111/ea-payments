import {NextRequest,NextResponse} from 'next/server';
import {adminApiUnauthorized,guardAdminApi} from '@/lib/api/admin-route';
import {airtableConfigured,airtableQuery,airtableUpdate} from '@/lib/data/airtable-client';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const TABLE='Cigar CTP Lead Intake';
const respond=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
type Finding={title?:string;explanation?:string};
function publicRecord(record:{id:string;fields:Record<string,unknown>}){
 const f=record.fields;
 let findings:Finding[]=[];
 try{const parsed=JSON.parse(String(f['Findings JSON']??'{}'));findings=Array.isArray(parsed.findings)?parsed.findings.slice(0,3).map((x:Finding)=>({title:String(x.title??''),explanation:String(x.explanation??'')})):[];}
 catch{findings=[];}
 return {
  recordId:record.id,
  submissionId:String(f['Submission ID']??''),businessName:String(f['Business Name']??''),
  contactName:String(f['Contact Name']??''),email:String(f.Email??''),
  role:String(f['Business Type']??''),
  score:'Not quantified',findings,
  stage:String(f['Workflow Status']??'submitted'),emailStatus:String(f['Email Status']??''),
  bookingStatus:String(f['Booking Status']??''),
  submittedAt:String(f['Submitted At']??''),meetingAt:String(f['Meeting Scheduled At']??''),
  meetingEndsAt:String(f['Meeting Ends At']??''),meetingCompletedAt:String(f['Meeting Completed At']??''),
  meetingConfirmedAt:String(f['Meeting Confirmed At']??''),reminderSentAt:String(f['Reminder Sent At']??''),
 };
}
/** Authorized EA internal handoff only; does not expose protected leads to the public. */
export async function GET(req:NextRequest){
 const auth=await guardAdminApi(req);
 if(!auth.ok)return adminApiUnauthorized(auth);
 if(!airtableConfigured())return respond({ok:false,error:'Cigar CRM unavailable.'},503);
 const leads=await airtableQuery(TABLE,{maxRecords:100,sortField:'Submitted At',sortDirection:'desc'});
 return respond({ok:true,leads:leads.map(publicRecord)});
}
/** An attended meeting cannot be inferred from the clock; authorized EA staff must confirm it. */
export async function POST(req:NextRequest){
 const auth=await guardAdminApi(req);
 if(!auth.ok)return adminApiUnauthorized(auth);
 if(!airtableConfigured())return respond({ok:false,error:'Cigar CRM unavailable.'},503);
 let body:{recordId?:string;action?:string};
 try{body=(await req.json()) as typeof body;}catch{return respond({ok:false,error:'Invalid JSON.'},400);}
 if(body.action!=='complete'||!body.recordId||!/^rec[A-Za-z0-9]{14}$/.test(body.recordId))
  return respond({ok:false,error:'Invalid completion request.'},400);
 // Airtable search by internal record ID is scoped ONLY to the dedicated Cigar CTP table.
 const leads=await airtableQuery(TABLE,{filterByFormula:`RECORD_ID()='${body.recordId}'`,maxRecords:1});
 const existing=leads[0];
 if(!existing)return respond({ok:false,error:'Cigar lead not found.'},404);
 const status=String(existing.fields['Workflow Status']??'');
 const endTime=new Date(String(existing.fields['Meeting Ends At']??'')).getTime();
 if(status==='completed')return respond({ok:true,alreadyCompleted:true,lead:publicRecord(existing)});
 if(status!=='scheduled'||existing.fields['Booking Status']!=='active'||!Number.isFinite(endTime)||endTime>Date.now())
  return respond({ok:false,error:'Only an ended, active scheduled meeting can be marked completed.'},409);
 const saved=await airtableUpdate(TABLE,existing.id,{'Workflow Status':'completed','Meeting Completed At':new Date().toISOString()});
 return saved?respond({ok:true,lead:publicRecord(saved)}):respond({ok:false,error:'Could not update meeting completion.'},503);
}
