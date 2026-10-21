export const dynamic='force-dynamic';
'use client';
import {useState} from 'react';
export default function Page(){
  const [name,setName]=useState(''); const [c,setC]=useState(false); const [l,setL]=useState(false);
  async function submit(e:any){e.preventDefault(); if(!name||!c) return alert('Name + consent required'); setL(true);
    try{ const r=await fetch('/api/tarris/sign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,consent:true,email:'tarrisb73@yahoo.com',recordId:'recd9zuiS7lDhBLAm'})}); if(r.ok) location.href='/pay/tarris-bouie'; else{ const d=await r.json(); alert(d.error||'Failed'); } }catch{alert('Failed')} setL(false);
  }
  return (<main className="min-h-screen bg-white px-6 py-12"><div className="mx-auto max-w-xl"><p className="text-xs font-bold uppercase tracking-widest text-neutral-500">EA</p><h1 className="mt-4 text-3xl font-bold">Sign Agreement</h1><form onSubmit={submit} className="mt-8 space-y-6"><div><label className="text-sm font-bold">Full Legal Name</label><input value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full border border-black px-4 py-3" placeholder="Tarris Bouie" required/></div><label className="flex gap-3 text-sm"><input type="checkbox" checked={c} onChange={e=>setC(e.target.checked)} required/>I agree to Client Services Agreement</label><button disabled={l} className="w-full bg-black text-white py-4 font-bold uppercase text-sm">{l?'Processing...':'Sign & Pay $500 →'}</button></form></div></main>);
}