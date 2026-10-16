'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
export default function StudentProgressAction({orgSlug,enrollmentId,moduleId,complete,completedModules}:{
  orgSlug:string;enrollmentId:string;moduleId:string;complete:boolean;completedModules:string[];
}){
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const router=useRouter();
  async function toggle(){
    setBusy(true);setError('');
    const updated=complete?completedModules.filter(x=>x!==moduleId):[...new Set([...completedModules,moduleId])];
    try{
      const res=await fetch('/api/subportal/progress',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({orgSlug,enrollmentId,currentModule:moduleId,completedModules:updated}),
      });
      if(!res.ok)throw new Error('Progress could not be saved');
      router.refresh();
    }catch{setError('Unable to save. Please retry.');}
    finally{setBusy(false);}
  }
  return <span style={{display:'inline-flex',flexDirection:'column',gap:3,marginLeft:8}}>
    <button type="button" disabled={busy} onClick={toggle} aria-label={complete?'Mark lesson incomplete':'Mark lesson complete'}
      style={{border:'1px solid #bbb',background:'white',padding:'6px 10px',borderRadius:6,cursor:'pointer'}}>
      {busy?'Saving…':complete?'Completed ✓':'Mark complete'}
    </button>{error?<small role="alert">{error}</small>:null}
  </span>;
}