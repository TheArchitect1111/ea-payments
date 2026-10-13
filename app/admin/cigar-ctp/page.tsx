'use client';
import {useEffect,useState} from 'react';
type Finding={title:string;explanation:string};
type Lead={
 isTest:boolean;recordId:string;submissionId:string;businessName:string;contactName:string;email:string;
 role:string;score:string;findings:Finding[];stage:string;emailStatus:string;bookingStatus:string;
 submittedAt:string;meetingAt:string;meetingEndsAt:string;meetingCompletedAt:string;
 meetingConfirmedAt:string;reminderSentAt:string;
};
const date=(s:string)=>s&&Number.isFinite(new Date(s).getTime())
 ?new Date(s).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'}):'Not booked';
export default function CigarCtpHandoff(){
 const [leads,setLeads]=useState<Lead[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[ready,setReady]=useState(false);
 const reload=async()=>{
  const r=await fetch('/api/admin/cigar-ctp/handoff',{cache:'no-store'});
  const data=await r.json() as {ok:boolean;leads?:Lead[];error?:string};
  if(!r.ok||!data.ok)throw new Error(data.error??'EA administrator access required.');
  setLeads(data.leads??[]);
 };
 useEffect(()=>{void reload().catch(e=>setError(e.message)).finally(()=>setReady(true));},[]);
 const complete=async(lead:Lead)=>{
  if(busy)return;
  setBusy(true);setError('');
  try{
   const r=await fetch('/api/admin/cigar-ctp/handoff',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:lead.isTest?'complete-test':'complete',recordId:lead.recordId})
   });
   const data=await r.json() as {ok:boolean;error?:string};
   if(!r.ok||!data.ok)throw new Error(data.error??'Could not confirm meeting completion.');
   await reload();
  }catch(e){setError(e instanceof Error?e.message:'Unable to update.');}
  finally{setBusy(false);}
 };
 return <main className="min-h-screen bg-[#f6f0e6] px-5 py-10 text-[#17211c]">
  <div className="mx-auto max-w-6xl">
   <p className="text-xs font-bold uppercase tracking-[0.23em] text-[#9a7946]">Efficiency Architects · Internal Only</p>
   <h1 className="mt-3 font-serif text-4xl">Cigar CTP Strategy Handoff</h1>
   <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">Assessment submissions, evaluation findings, email delivery, and verified Calendly scheduling. Financial scores are not fabricated when the assessment is qualitative.</p>
   {error&&<p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
   {!ready?<p className="mt-7">Loading cigar submissions…</p>:null}
   {ready&&leads.length===0&&!error?<p className="mt-7">No cigar intake records yet.</p>:null}
   <div className="mt-7 space-y-5">{leads.map(lead=><section key={lead.recordId} className="min-w-0 break-words rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="min-w-0"><h2 className="font-serif text-2xl">{lead.businessName}</h2><p className="mt-1 text-sm text-stone-600">{lead.contactName} · {lead.email}</p><p className="mt-1 text-xs text-stone-500">{lead.role} · {lead.submissionId}</p></div>
     <span className="rounded-full border border-[#b48a49] px-4 py-2 text-xs font-bold uppercase tracking-wide">{lead.stage}</span>
    </div>
    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
     <div><strong>CTP evaluation</strong><p className="mt-1 text-stone-600">{lead.score} · {lead.findings.length} findings</p></div>
     <div><strong>Email</strong><p className="mt-1 text-stone-600">{lead.emailStatus||'Pending'}</p></div>
     <div><strong>Meeting</strong><p className="mt-1 text-stone-600">{date(lead.meetingAt)} · {lead.bookingStatus||'Not booked'}</p></div>
    </div>
    {lead.findings.length>0&&<div className="mt-5 rounded-xl bg-[#faf7f0] p-4"><h3 className="text-sm font-bold">Evaluation summary</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6">{lead.findings.map((x,i)=><li key={i}><strong>{x.title}</strong>: {x.explanation}</li>)}</ul></div>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
     <p className="text-xs text-stone-600">Meeting confirmed: {lead.meetingConfirmedAt?'Yes':'Not confirmed'} · Reminder sent: {lead.reminderSentAt?'Yes':'No'}</p>
     {lead.isTest&&lead.stage!=='completed'&&<button type="button" disabled={busy} onClick={()=>void complete(lead)} className="min-h-12 w-full rounded-full bg-[#17211c] px-5 py-3 text-base font-bold text-white disabled:opacity-50 sm:w-auto">Mark TEST completed</button>}
     {lead.isTest&&lead.stage==='completed'&&<p role="status" className="text-sm font-semibold">TEST workflow completed</p>}
     {!lead.isTest&&lead.stage==='scheduled'&&lead.bookingStatus==='active'&&Number.isFinite(new Date(lead.meetingEndsAt).getTime())&&new Date(lead.meetingEndsAt).getTime()<=Date.now()&&
     <button type="button" disabled={busy} onClick={()=>void complete(lead)} className="min-h-12 w-full rounded-full bg-[#17211c] px-5 py-3 text-base font-bold text-white disabled:opacity-50 sm:w-auto">Confirm meeting completed</button>}
    </div>
   </section>)}</div>
  </div>
 </main>;
}
