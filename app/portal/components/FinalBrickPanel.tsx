'use client';
import {useCallback,useEffect,useState} from 'react';
type Kind='pulse'|'amplifi'|'update-hub'|'messaging'|'training'|'landing'|'ask'|'settings'|'ctp';
type Row={key:string;title:string;body:string;state:string;reply?:string;progress?:number};
export default function FinalBrickPanel({kind,title}:{kind:Kind;title:string}){
 const [key,setKey]=useState(''),[body,setBody]=useState(''),[reply,setReply]=useState('');
 const [rows,setRows]=useState<Row[]>([]),[message,setMessage]=useState('');
 const [working,setWorking]=useState(false);
 const refresh=useCallback(async()=>{
  const response=await fetch('/api/portal/final-bricks?kind='+encodeURIComponent(kind),{cache:'no-store'});
  if(response.ok){const result=await response.json();setRows(result.records||[]);}
 },[kind]);
 useEffect(()=>{void refresh();},[refresh]);
 const request=async(input:Record<string,unknown>)=>{
  setWorking(true);setMessage('');
  try{
   const response=await fetch('/api/portal/final-bricks',{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,...input})});
   const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'Save failed');
   setMessage('Saved to the tenant activity ledger');await refresh();
  }catch(e){setMessage(e instanceof Error?e.message:'Save failed');}
  finally{setWorking(false);}
 };
 const next=(row:Row):{state:string;reply?:string;progress?:number}|null=>{
  if(['ask','messaging','update-hub'].includes(kind)){
   if(row.state==='submitted')return {state:'delivered'};
   if(row.state==='delivered')return {state:'responded',reply:reply.trim()};
   return null;
  }
  if(kind==='training'){
   if(row.state==='enrolled')return {state:'in_progress',progress:50};
   if(row.state==='in_progress')return {state:'completed',progress:100};
   return null;
  }
  if(kind==='pulse')return row.state==='draft'?{state:'ready'}:row.state==='ready'?{state:'delivered'}:null;
  if(['amplifi','landing'].includes(kind))return row.state==='draft'?{state:'ready'}:row.state==='ready'?{state:'published'}:null;
  if(kind==='ctp')return row.state==='ready'?{state:'in_progress'}:row.state==='in_progress'?{state:'completed'}:null;
  return null;
 };
 return <section className="ep-module-card">
  <h2 className="ep-module-card-title">{title}</h2>
  <p className="ep-module-card-note">Your records, progress and replies stay within this portal.</p>
  <label>Title<input value={key} onChange={e=>setKey(e.target.value)} maxLength={80}/></label>
  <label>Details<textarea value={body} onChange={e=>setBody(e.target.value)} maxLength={25000}/></label>
  <button type="button" className="ep-btn" disabled={working} onClick={()=>{
   const id=key.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-');
   if(!id||!body.trim()){setMessage('Enter a title and description');return;}
   void request({action:'create',key:id,title:key,body,visibility:'member'});
  }}>Submit / save</button>
  <ul className="ep-module-list">
   {rows.filter(r=>r.key!=='welcome').map(r=>{
    const action=next(r);
    return <li className="ep-module-card" key={r.key}>
     <strong>{r.title}</strong><p>{r.body}</p>
     <p className="ep-module-card-note">Status: {r.state}{r.progress!==undefined?' · '+r.progress+'%':''}</p>
     {r.reply?<p className="ep-module-card-note">Response: {r.reply}</p>:null}
     {action&&['ask','messaging','update-hub'].includes(kind)&&r.state==='delivered'?
       <label>Response<input value={reply} onChange={e=>setReply(e.target.value)}/></label>:null}
     {action?<button type="button" className="ep-btn" disabled={working}
      onClick={()=>void request({action:'transition',key:r.key,...action})}>
      {action.state==='published'?'Publish':action.state==='completed'?'Complete':
       action.state==='responded'?'Respond':action.state==='delivered'?'Deliver':
       action.state==='in_progress'?'Start':'Continue'}
     </button>:null}
    </li>;
   })}
  </ul>
  {message?<p role="status" className="ep-module-card-note">{message}</p>:null}
 </section>;
}
