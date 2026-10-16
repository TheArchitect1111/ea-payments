'use client';
import {useState} from 'react';
export default function CheckoutCard({orgSlug,offerId,amountCadCents,provider,title}:{
  orgSlug:string;offerId:string;amountCadCents:number;provider:'stripe'|'square';title:string;
}){
  const [name,setName]=useState('');const [email,setEmail]=useState('');
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  async function submit(event:React.FormEvent){
    event.preventDefault();setBusy(true);setError('');
    try{
      const res=await fetch('/api/subportal/checkout',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({orgSlug,offerId,name,email}),
      });
      const body=await res.json();
      if(!res.ok || typeof body.checkoutUrl!=='string' || !/^https:\/\//.test(body.checkoutUrl))
        throw new Error('Checkout is unavailable');
      window.location.assign(body.checkoutUrl);
    }catch{setError('Secure checkout is unavailable. Please contact the program owner.');setBusy(false);}
  }
  return <form onSubmit={submit} style={{border:'1px solid #ddd',borderRadius:14,padding:22,background:'white'}}>
    <h2>{title}</h2>
    <p>{'CAD $'+(amountCadCents/100).toFixed(2)} · {provider==='square'?'Square':'Stripe'}</p>
    <label style={{display:'block'}}>Your full name<input required maxLength={200} value={name}
      onChange={e=>setName(e.target.value)} style={{display:'block',padding:9,width:'100%'}}/></label>
    <label style={{display:'block',marginTop:12}}>Email for portal access<input required type="email"
      value={email} onChange={e=>setEmail(e.target.value)}
      style={{display:'block',padding:9,width:'100%'}}/></label>
    <button type="submit" disabled={busy} style={{marginTop:14,padding:12,cursor:'pointer'}}>
      {busy?'Opening secure checkout…':'Enroll securely'}
    </button>
    {error?<p role="alert">{error}</p>:null}
  </form>;
}