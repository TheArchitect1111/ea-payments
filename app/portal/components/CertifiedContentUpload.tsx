'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function CertifiedContentUpload({kind}:{kind:'documents'|'resources'}){
 const [message,setMessage]=useState(''),[working,setWorking]=useState(false);
 const router=useRouter();
 return <form className="ep-module-card" onSubmit={async event=>{
  event.preventDefault();setWorking(true);setMessage('');
  try{
   const form=new FormData(event.currentTarget);form.set('kind',kind);
   const response=await fetch('/api/portal/content/upload',{method:'POST',body:form});
   const result=await response.json();
   if(!response.ok||!result.ok)throw new Error(result.error||'Upload failed');
   setMessage('File saved privately.');router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:'Upload failed');}
  finally{setWorking(false);}
 }}>
  <label className="ep-module-card-title" htmlFor={kind+'-upload'}>Add private {kind==='documents'?'document':'resource'}</label>
  <p className="ep-module-card-note">PDF, plain text, Markdown, PNG or JPEG. Maximum 120 KB.</p>
  <input id={kind+'-upload'} type="file" name="file" accept=".pdf,.txt,.md,.png,.jpg,.jpeg" required/>
  <label htmlFor={kind+'-visibility'}>Access</label>
  <select id={kind+'-visibility'} name="visibility" defaultValue="staff">
   <option value="staff">Staff only</option><option value="member">Portal members</option>
  </select>
  <button className="ep-btn" type="submit" disabled={working}>{working?'Saving...':'Save file'}</button>
  {message?<p role="status" className="ep-module-card-note">{message}</p>:null}
 </form>;
}
