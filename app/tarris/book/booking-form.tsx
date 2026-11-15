"use client";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { opportunityTypes, budgetRanges } from '@/lib/tb3/contracts';
import { tb3MerchCatalog as merchCatalog } from '@/lib/tb3/merch-catalog';
export default function BookingForm({manual=false,onSaved}:{manual?:boolean;onSaved?:()=>void}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  const [merchandise,setMerchandise]=useState(false);
  const [requestedProduct,setRequestedProduct]=useState<string|null>(null);
  const [inquiry,setInquiry]=useState('');
  const [panelOpen,setPanelOpen]=useState(false);
  const dialogRef=useRef<HTMLDivElement>(null);
  const busyRef=useRef(false);
  busyRef.current=busy;
  const triggerRef=useRef<HTMLButtonElement|null>(null);
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const merch = params.get('type') === 'merch';
    setMerchandise(merch);
    if(merch) setPanelOpen(true);
    const product = merchCatalog.find(item => item.id === params.get('product'));
    setRequestedProduct(merch && product ? product.name : null);
  },[]);
  const request=useRef<string|null>(null);
  const choices=[['Book Tarris','Appearances, events and speaking engagements','Appearance'],['Brand Partnership','Campaigns, collaborations and sponsorships','Brand Partnership'],['Other Collaboration','Something unique? Tell us what you have in mind','Other']] as const;
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(busy)return;setError('');setBusy(true);const form=new FormData(event.currentTarget);request.current ||= crypto.randomUUID();
    const record={contact_name:String(form.get('name')),company_name:merchandise?'Individual customer':String(form.get('company')),contact_email:String(form.get('email')),phone:String(form.get('phone')||''),type:merchandise?'Other':String(form.get('type')),budget_range:merchandise?budgetRanges[0]:String(form.get('budget')),date_requested:merchandise?null:String(form.get('date')||'')||null,vision_answer:merchandise?'Interested in official TB3 merchandise and product availability.':String(form.get('vision')),message:String(form.get('message')||''),request_id:request.current};
    try {const res=await fetch('/api/opportunities/create'+(manual?'?manual=true':''),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(record)});const result=await res.json();if(!res.ok||!result.ok)throw new Error(result.error||'Inquiry could not be saved.');setSaved(true);onSaved?.();}catch(err){setError(err instanceof Error?err.message:'Inquiry could not be saved. Please try again.');}finally{setBusy(false);}}
  useEffect(() => {
    if (!panelOpen || manual) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) setPanelOpen(false);
    };
    window.addEventListener('keydown', onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onEscape);
      triggerRef.current?.focus();
    };
  }, [panelOpen, manual]);

  function openInquiry(value: string, trigger: HTMLButtonElement) {
    triggerRef.current=trigger;
    setInquiry(value);
    setError('');
    setSaved(false);
    setPanelOpen(true);
  }
  function trapFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return;
    const controls=Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]')||[]).filter(el=>el.getClientRects().length>0);
    if(!controls.length) return;
    if(event.shiftKey && document.activeElement===controls[0]) { event.preventDefault(); controls[controls.length-1].focus(); }
    if(!event.shiftKey && document.activeElement===controls[controls.length-1]) { event.preventDefault(); controls[0].focus(); }
  }
  const input='mt-2 block w-full rounded-xl border border-white/15 bg-white/[0.06] p-3.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/30';
  const content = saved
    ? <div role="status" className="mt-8 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-6 leading-7 text-emerald-100">
        <h3 className="font-serif text-3xl">Inquiry received.</h3>
        <p className="mt-3 text-sm">Thank you. The TB3 team will follow up regarding your request. Submitting an inquiry does not confirm a booking.</p>
      </div>
    : <form onSubmit={submit} className="mt-7 grid gap-4 sm:grid-cols-2">
    <label className="text-xs font-semibold tracking-wide text-white/75">Name *<input name="name" required maxLength={200} autoComplete="name" className={input}/></label>{!merchandise&&<label className="text-xs font-semibold tracking-wide text-white/75">Company *<input name="company" required maxLength={200} autoComplete="organization" className={input}/></label>}<label className="text-xs font-semibold tracking-wide text-white/75">Email *<input name="email" type="email" required maxLength={320} autoComplete="email" className={input}/></label><label className="text-xs font-semibold tracking-wide text-white/75">Phone<input name="phone" type="tel" maxLength={60} autoComplete="tel" className={input}/></label>{!merchandise&&<label className="text-xs font-semibold tracking-wide text-white/75">Inquiry type *<select key={`${merchandise}-${inquiry}`} name="type" required value={inquiry} onChange={event=>setInquiry(event.target.value)} className={input}><option className="text-black" value="">Select type</option>{opportunityTypes.map(t=><option className="text-black" key={t} value={t}>{t}</option>)}</select></label>}{!merchandise&&<label className="text-xs font-semibold tracking-wide text-white/75">Budget<select name="budget" className={input}>{budgetRanges.map(b=><option className="text-black" key={b}>{b}</option>)}</select></label>}{!merchandise&&<label className="text-xs font-semibold tracking-wide text-white/75 sm:col-span-2">Date requested<input name="date" type="date" className={input}/></label>}{!merchandise&&<label className="text-xs font-semibold tracking-wide text-white/75 sm:col-span-2">Vision alignment *<span className="mt-2 block font-normal leading-6 text-white/55">What does Same Vision, Bigger Purpose mean to you? How does this align with Discipline, Determination, Development and Destiny?</span><textarea name="vision" required maxLength={5000} rows={3} className={input}/></label>}<label className="text-xs font-semibold tracking-wide text-white/75 sm:col-span-2">Message<textarea key={merchandise?`merch-message-${requestedProduct||"general"}`:"message"} defaultValue={merchandise?requestedProduct?`Please contact me about ${requestedProduct} (availability and ordering).`:"I would like information about TB3 merchandise availability and ordering.":""} name="message" maxLength={10000} rows={3} className={input}/></label>{error&&<p role="alert" className="text-sm text-red-300 sm:col-span-2">{error}</p>}<button aria-busy={busy} type="submit" className="rounded-xl bg-[#C41E3A] px-5 py-4 text-sm font-bold tracking-wide text-white transition hover:bg-[#a51c30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:col-span-2">{busy?'Submitting…':'Send inquiry →'}</button>
  </form>;
  if(manual) return <section id="manual-opportunity-form" className="rounded-2xl border border-white/10 bg-[#101114] p-6 text-white sm:p-9">
    <p className="text-xs font-bold tracking-[0.2em] text-[#E2475D]">TB3 | INTERNAL OPPORTUNITIES</p>
    <h2 className="mt-3 font-serif text-3xl">Track Opportunity</h2>
    {content}
  </section>;
  return <section id="book-tarris-form" className="scroll-mt-24 text-white">
    {merchandise
      ? <div className="rounded-2xl border border-white/10 bg-[#17191e] p-7 sm:p-10">
          <p className="text-[10px] font-bold tracking-[0.24em] text-[#E2475D]">TB3 | FIRST ACCESS</p>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl">Request the next drop.</h2>
          <p className="mt-3 text-sm leading-7 text-white/60">Get details about merchandise availability. Ordering is not yet open.</p>
          <button type="button" onClick={event=>openInquiry('Other',event.currentTarget)} className="mt-6 rounded-xl bg-[#C41E3A] px-6 py-4 text-sm font-bold transition hover:bg-[#a51c30] focus-visible:ring-2 focus-visible:ring-white">Request merchandise information ↗</button>
        </div>
      : <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#E2475D]">CHOOSE YOUR OPPORTUNITY</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">Start with the opportunity that fits your vision. No paperwork until you're ready to connect.</p>
          <div className="mt-9 grid gap-4 md:grid-cols-3" role="group" aria-label="Choose an inquiry type">
        {choices.map(([title,subtitle,value],i)=><button key={value} type="button" onClick={event=>openInquiry(value,event.currentTarget)} className="group relative flex min-h-52 flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-left transition duration-200 hover:-translate-y-1 hover:border-[#E2475D]/60 hover:bg-white/[0.075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2475D]">
          <span className="text-[10px] font-bold tracking-[0.25em] text-[#E2475D]">0{i+1} / OPPORTUNITY</span>
          <span className="mt-9 flex items-center justify-between gap-3 text-xl font-semibold tracking-tight"><span>{title}</span><span aria-hidden="true" className="text-xl text-[#E2475D] transition group-hover:translate-x-1">↗</span></span>
          <span className="mt-3 max-w-xs text-sm leading-6 text-white/55">{subtitle}</span>
        </button>)}
      </div>
          <p className="mt-5 text-xs text-white/45">Each selection opens a private inquiry panel. A submitted inquiry is not a confirmed booking.</p>
        </div>}
    {panelOpen && <div className="fixed inset-0 z-[100] flex items-stretch justify-end bg-black/80 backdrop-blur-sm" onMouseDown={event=>{if(event.target===event.currentTarget && !busy)setPanelOpen(false);}}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="tb3-inquiry-panel-title" onKeyDown={trapFocus} className="flex h-full w-full max-w-3xl flex-col overflow-y-auto border-l border-white/10 bg-[#101114] p-5 shadow-2xl outline-none sm:p-9 lg:p-12">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#E2475D]">TB3 | PRIVATE INQUIRY</p>
            <h2 id="tb3-inquiry-panel-title" className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">{merchandise?'Merchandise first access':choices.find(item=>item[2]===inquiry)?.[0]||'Connect with TB3'}</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">Tell us about your opportunity. No booking is confirmed until the TB3 team follows up.</p>
          </div>
          <button type="button" disabled={busy} aria-label="Close inquiry panel" onClick={()=>setPanelOpen(false)} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-xl transition hover:border-[#E2475D] focus-visible:ring-2 focus-visible:ring-[#E2475D] disabled:opacity-50">×</button>
        </div>
        {content}
        {saved && <button type="button" className="mt-7 self-start rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold transition hover:border-[#E2475D]" onClick={()=>setPanelOpen(false)}>Close</button>}
        <p className="mt-8 border-t border-white/10 pt-5 text-xs leading-5 text-white/40">Information is sent through the existing secure TB3 inquiry workflow.</p>
      </div>
    </div>}
  </section>;
}
