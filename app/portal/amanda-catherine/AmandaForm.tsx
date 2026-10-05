"use client";
import {useState} from 'react';
import type {Field} from '@/lib/amanda-catherine/registry';
export default function AmandaForm({fields,label,type,formId,courseId='',context=''}:{fields:Field[];label:string;type:string;formId:string;courseId?:string;context?:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');
 const data=Object.fromEntries(new FormData(e.currentTarget));
 try{const res=await fetch('/api/amanda-catherine/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,type,formId,context})});const result=await res.json();if(!res.ok || !result.ok)throw new Error(result.error || 'Your details could not be saved. Please try again.');setSuccess(true);}catch(e){setError(e instanceof Error?e.message:'Unable to submit');}finally{setBusy(false);}}
 if(success)return <div role="status" className="amanda-alert">{type==='waitlist'?"You’re on the waitlist.":'Your details have been received.'} <a href="/portal/amanda-catherine/classes">Return to classes</a></div>;
 return <form onSubmit={submit}>{fields.map(f=><label key={f.name} htmlFor={`amanda-${f.name}`}>{f.label}{f.required?' *':''}{f.type==='textarea'?<textarea id={`amanda-${f.name}`} name={f.name} required={f.required} rows={5}/>:f.type==='select'?<select id={`amanda-${f.name}`} name={f.name} required={f.required} defaultValue={f.name==='courseId'?courseId:''}><option value="">Choose</option>{(f.options || []).map(o=><option key={o}>{o}</option>)}</select>:<input id={`amanda-${f.name}`} name={f.name} type={f.type} required={f.required} defaultValue={f.name==='courseId'?courseId:undefined} readOnly={f.name==='courseId' && !!courseId} maxLength={f.type==='text'?200:undefined}/>}</label>)}{error && <p role="alert" className="amanda-alert">{error}</p>}<button className="amanda-button" disabled={busy}>{busy?'Saving…':label}</button></form>;
}
