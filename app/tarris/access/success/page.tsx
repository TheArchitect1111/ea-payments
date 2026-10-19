'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
type Delivery={accessLink:string;receiptPdf:string;emailId:string};
export default function AccessSuccess() {
 const [delivery,setDelivery]=useState<Delivery|null>(null);const [error,setError]=useState('');
 useEffect(()=>{let active=true;const sessionId=new URLSearchParams(window.location.search).get('session_id');
 fetch('/api/tarris/access/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId})}).then(async r=>{const data=await r.json();if(!r.ok)throw Error(data.error||'Verification unavailable');if(active)setDelivery(data);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false};},[]);
 return <main className="mx-auto max-w-3xl p-8"><h1 className="text-3xl font-bold">Your TB3 Access</h1>{error?<p role="alert" className="mt-4">{error}</p>:delivery?<div className="mt-4"><p>Your payment was verified and access saved.</p><a href={delivery.accessLink} rel="noreferrer" className="mt-4 inline-block underline">Open your 72-hour access →</a><p className="mt-3">Your access email was accepted by the email provider.</p><a href={delivery.receiptPdf} rel="noreferrer" className="underline">View payment receipt</a></div>:<p className="mt-4">Verifying your payment and saving access…</p>}<Link href="/tarris" className="mt-6 inline-block underline">Return to TB3</Link></main>;
}
