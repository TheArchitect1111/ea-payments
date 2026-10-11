'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
type Kind='pulse'|'amplifi'|'update-hub'|'messaging'|'training'|'landing'|'ask'|'settings'|'ctp';
export default function FinalBrickPanel({kind,title}:{kind:Kind;title:string}){
 const [key,setKey]=useState(''),[text,setText]=useState(''),[message,setMessage]=useState('');
 const router=useRouter();
 const submit=async()=>{
  try{
   const id=key.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-');
   if(!id||!text.trim())throw Error('Enter a title and description');
   const response=await fetch('/api/portal/final-bricks',{method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({kind,action:'create',key:id,title:key,body:text,
     visibility:'member',state:['messaging','update-hub','ask'].includes(kind)?'submitted':'draft'})});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Unable to save');
   setMessage('Saved to your workspace');router.refresh();
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to save');}
 };
 return <div className="ep-module-card">
  <p className="ep-module-card-title">{title}</p>
  <p className="ep-module-card-note">Your entries are private to this organization's portal.</p>
  <label>Title<input value={key} onChange={e=>setKey(e.target.value)} maxLength={80}/></label>
  <label>Details<textarea value={text} onChange={e=>setText(e.target.value)} maxLength={25000}/></label>
  <button type="button" className="ep-btn" onClick={submit}>Save to workspace</button>
  {message?<p role="status">{message}</p>:null}
 </div>;
}