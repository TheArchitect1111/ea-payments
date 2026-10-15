'use client';

import { useId, useState, type FormEvent } from 'react';
import ConfirmationLetter, { type ConfirmationLetterData } from './ConfirmationLetter';
import AmandaWarmLetter from './AmandaWarmLetter';

export default function AmandaWaitlistForm({
  courseId,
  courseName,
  status = 'WAITLIST',
  squareCheckoutUrl = null,
  submitLabel,
}: {
  courseId: string;
  courseName: string;
  status?: string;
  squareCheckoutUrl?: string | null;
  submitLabel?: string;
}) {
  const id = useId();
  const [statusMessage, setStatusMessage] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationLetterData | null>(null);
  const [busy, setBusy] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [paymentBusy, setPaymentBusy] = useState(false);
  const fieldClassName = 'w-full rounded-xl border border-black/20 bg-white px-4 py-3 text-black shadow-sm placeholder:text-black/40 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatusMessage('');
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/public/amanda/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          name: fields.get('name'),
          email: fields.get('email'),
          phone: fields.get('phone'),
          message: fields.get('message'),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setStatusMessage(result.error || 'Please try again.');
        return;
      }
      setConfirmation(result.confirmation || null);
      setRegisteredEmail(String(fields.get('email') || '').trim().toLowerCase());
    } catch {
      setStatusMessage('Your details could not be saved. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function beginSquareCheckout() {
    setPaymentBusy(true); setStatusMessage('');
    try {
      const response=await fetch('/api/amanda-catherine/square-checkout',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:registeredEmail,class_id:courseId}),
      });
      const result=await response.json();
      if(!response.ok||!result.url)throw new Error(result.error||'Square checkout unavailable');
      window.location.assign(result.url);
    }catch(error){setStatusMessage(error instanceof Error?error.message:'Square checkout unavailable');}
    finally{setPaymentBusy(false);}
  }
  if (confirmation) {
    return <div>
      <ConfirmationLetter letter={confirmation} firstName={confirmation.first_name} className={courseName} includeWelcome />
      {confirmation.type==='live' ? <button type="button" onClick={()=>void beginSquareCheckout()}
        disabled={paymentBusy} className="mt-6 w-full rounded-xl bg-[#17211c] px-5 py-3 text-white">
        {paymentBusy?'Opening secure payment…':'Continue to secure Square payment'}
      </button> : null}
      {statusMessage?<p role="alert" className="mt-3 text-red-800">{statusMessage}</p>:null}
    </div>;
  }

  return (
    <>
    <AmandaWarmLetter compact />
    <form onSubmit={submit} aria-busy={busy} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-[#17211c]" htmlFor={`${id}-name`}>
        <span>Name</span>
        <input
          className={fieldClassName}
          id={`${id}-name`}
          name="name"
          type="text"
          inputMode="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#17211c]" htmlFor={`${id}-email`}>
        <span>Email</span>
        <input
          className={fieldClassName}
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={254}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#17211c]" htmlFor={`${id}-phone`}>
        <span>Phone</span>
        <input
          className={fieldClassName}
          id={`${id}-phone`}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={40}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#17211c]" htmlFor={`${id}-course`}>
        <span>Class</span>
        <input className={fieldClassName} id={`${id}-course`} value={courseName} readOnly />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#17211c]" htmlFor={`${id}-message`}>
        <span>Message</span>
        <textarea
          className={fieldClassName}
          id={`${id}-message`}
          name="message"
          rows={4}
          maxLength={2000}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          className="w-full rounded-xl bg-[#17211c] px-5 py-3 font-medium text-white shadow-sm transition hover:bg-[#27372d] focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:cursor-wait disabled:opacity-60"
          disabled={busy}
          type="submit"
        >
          {busy ? 'Submitting…' : submitLabel || (status.toUpperCase() === 'LIVE' ? 'Enroll Now' : 'Join Waitlist')}
        </button>
        {squareCheckoutUrl ? <a href={squareCheckoutUrl} target="_blank" rel="noopener noreferrer"
          data-cta-name="Buy Now" data-cta-key={`buy-now-${courseId}`} data-course-key={courseId}
          className="flex w-full items-center justify-center rounded-xl border border-[#17211c] bg-white px-5 py-3 font-medium text-[#17211c] shadow-sm transition hover:bg-[#f4f0e8] focus:outline-none focus:ring-2 focus:ring-amber-500/40">
          Buy Now
        </a> : null}
      </div>
      <p className="min-h-5 text-sm text-[#7a3128]" role="status" aria-live="polite">{statusMessage}</p>
    </form>
    </>
  );
}
