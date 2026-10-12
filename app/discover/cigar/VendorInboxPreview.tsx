'use client';
import {useState} from 'react';
import {evaluateVendorAction,type VendorAction} from '@/lib/cigar-ctp/vendor-guard';

/** Non-sending inbox exercise. It does not provision an address, persist vendor data, or perform actions. */
export default function VendorInboxPreview({businessName}:{businessName:string}){
 const [address,setAddress]=useState('');
 const [due,setDue]=useState('');
 const [approved,setApproved]=useState(false);
 const [action,setAction]=useState<VendorAction>('request-report');
 const [reminders,setReminders]=useState(0);
 const [showDraft,setShowDraft]=useState(false);
 const decision=evaluateVendorAction(action,businessName,address,{
  approved,recipientVerified:approved,approvedEmail:address.trim(),
  reportDueAt:due?new Date(due+'T00:00:00').toISOString():undefined,
  maxReminders:2,remindersSent:reminders,paused:false
 });
 return <details className="mt-5 rounded-xl border border-stone-200 bg-white p-4">
   <summary className="cursor-pointer font-semibold">Explore the vendor reporting inbox (safe simulation)</summary>
   <p className="mt-3 text-sm text-stone-600">This is a draft-only exercise to show how overdue reports could be tracked. It cannot send email, receive mail, or create an address. Real businesses must authorize mailbox access and verify each vendor.</p>
   <label className="mt-4 block text-sm font-semibold">Vendor email (simulation only)
    <input type="email" value={address} onChange={e=>{setAddress(e.target.value.slice(0,180));setShowDraft(false);}} placeholder="reporting@example.com" className="mt-1 w-full rounded-lg border border-stone-300 p-2"/>
   </label>
   <label className="mt-3 block text-sm font-semibold">When was the report due?
    <input type="date" value={due} onChange={e=>{setDue(e.target.value);setShowDraft(false);}} className="mt-1 w-full rounded-lg border border-stone-300 p-2"/>
   </label>
   <label className="mt-3 block text-sm font-semibold">Message type
    <select value={action} onChange={e=>{setAction(e.target.value as VendorAction);setShowDraft(false);}} className="mt-1 w-full rounded-lg border border-stone-300 p-2">
     <option value="acknowledge">Acknowledge report receipt</option>
     <option value="request-report">Request an overdue report</option>
     <option value="reminder">Send a scheduled reminder</option>
     <option value="invoice-question">Ask about an invoice discrepancy</option>
     <option value="place-order">Place an order</option>
     <option value="approve-payment">Authorize a payment</option>
    </select>
   </label>
   <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" checked={approved} onChange={e=>{setApproved(e.target.checked);setShowDraft(false);}} className="mt-1"/>Simulate owner approval and recipient verification for this draft only</label>
   <label className="mt-3 block text-sm">Number of reminders already sent (simulation)
    <select value={reminders} onChange={e=>setReminders(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-stone-300 p-2">
     <option value="0">None</option><option value="1">One</option><option value="2">Two</option>
    </select>
   </label>
   <button type="button" className="mt-4 rounded-full bg-stone-900 px-5 py-3 text-sm font-bold text-white" onClick={()=>setShowDraft(true)}>Check policy and draft message</button>
   {showDraft && <div className="mt-4 rounded-lg bg-stone-100 p-4 text-sm" role="status">
    <p className="font-bold">Policy result: {decision.status}</p>
    <p className="mt-2">{decision.reason}</p>
    {decision.subject&&<><p className="mt-3 font-bold">Subject: {decision.subject}</p><p className="mt-1 whitespace-pre-wrap">{decision.body}</p></>}
    <p className="mt-3 font-bold text-amber-900">Not sent. No live mailbox, vendor account, or automated sending is enabled.</p>
   </div>}
 </details>;
}
