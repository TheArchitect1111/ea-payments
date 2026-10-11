'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function CertifiedReportGenerator({sourceKind}:{sourceKind:'documents'|'resources'}){
 const [status,setStatus]=useState(''),[working,setWorking]=useState(false),router=useRouter();
 return <div className="ep-module-card">
  <p className="ep-module-card-title">Generate an operational snapshot</p>
  <p className="ep-module-card-note">Private, tenant-scoped report from your {sourceKind} inventory.</p>
  <button type="button" className="ep-btn" disabled={working} onClick={async()=>{
   setWorking(true);setStatus('');
   try{
    const response=await fetch('/api/portal/content',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({kind:'reports',action:'generate',key:'operational-report',sourceKind})});
    const data=await response.json();
    if(!response.ok||!data.ok)throw new Error(data.error||'Report generation failed');
    setStatus('Report generated and saved.');router.refresh();
   }catch(e){setStatus(e instanceof Error?e.message:'Report generation failed');}
   finally{setWorking(false);}
  }}>{working?'Generating...':'Generate report'}</button>
  {status?<p role="status" className="ep-module-card-note">{status}</p>:null}
 </div>;
}
