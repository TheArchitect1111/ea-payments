'use client';
import { useState } from 'react';
import { pickupSelection } from '@/app/components/amanda/KitFulfillmentFields';

type Course = { id: string; name: string; priceCad: number };
const approvedStudioImage: Record<string, string> = {
  'body-sculpt-practitioner-certification': '/amanda-catherine/studio-treatment.jpg',
  'aesthetikine-reset-training': '/amanda-catherine/studio-interior.jpg',
  'wood-therapy-certification': '/amanda-catherine/studio-treatment.jpg',
  'non-surgical-bbl-training': '/amanda-catherine/studio-interior.jpg',
  'clinical-fat-loss-injectables': '/amanda-catherine/studio-treatment.jpg',
};
export default function AmandaTestEnrollmentCards({courses}:{courses:Course[]}) {
 const [testName,setTestName]=useState('');
 const [busy,setBusy]=useState('');
 const [error,setError]=useState('');
 async function checkout(course:Course){
   setBusy(course.id);setError('');
   try {
     const response=await fetch('/api/portal/amanda/checkout',{method:'POST',headers:{'Content-Type':'application/json'},
       body:JSON.stringify({offerId:course.id,paymentOption:'test',testName,...pickupSelection})});
     const data=await response.json();
     if(!response.ok||!data.url)throw new Error(data.error||'Unable to start private checkout.');
     window.location.assign(data.url);
   }catch(e){setError(e instanceof Error?e.message:'Checkout unavailable.');setBusy('');}
 }
 return <section aria-label="Private test enrollment options">
  <label htmlFor="amanda-test-name">Test registration name</label>
  <input id="amanda-test-name" value={testName} onChange={e=>setTestName(e.target.value)} minLength={2}
    placeholder="Name for test enrollment" style={{display:'block',margin:'10px 0 24px',padding:12,width:'min(100%,420px)'}}/>
  {error?<p role="alert">{error}</p>:null}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:18}}>
   {courses.map(course=><article className="ep-module-card" key={course.id}>
     <img src={approvedStudioImage[course.id] || '/amanda-catherine/studio-interior.jpg'}
       alt="AesthetiKine Studio training environment" loading="lazy"
       style={{width:'100%',height:160,objectFit:'cover',borderRadius:8,marginBottom:12}} />
     <h2>{course.name}</h2>
     <p>Full price: CAD ${course.priceCad.toLocaleString('en-CA')}</p>
     <p>Private test: CAD $1.00 · access expires after 72 hours</p>
     <button data-cta-name={"Private test "+course.name} data-cta-key={"private-test-"+course.id} type="button" className="ep-btn" disabled={Boolean(busy)||testName.trim().length<2} onClick={()=>void checkout(course)}>
       {busy===course.id?'Opening secure checkout…':'CAD $1 Test — No auto-charge'}
     </button>
   </article>)}
  </div>
 </section>;
}
