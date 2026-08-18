'use client';

import { FormEvent, useState } from 'react';

type Course = {
  offerId: string;
  courseId: string;
  title: string;
  priceCad: number;
  compareAtPriceCad?: number;
  saleLabel?: string;
  delivery: string[];
};

export default function AmandaEnrollmentForm({ courses }: { courses: Course[] }) {
  const [offerId, setOfferId] = useState(courses[0]?.offerId || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/public/amanda/enrollment/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ offerId, name, email }),
      });
      const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || 'Secure checkout could not be opened.');
      window.location.assign(data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Secure checkout could not be opened.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-9 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
      <fieldset>
        <legend className="font-serif text-3xl">1. Select your course</legend>
        <div className="mt-5 grid gap-4">
          {courses.map((course) => {
            const selected = offerId === course.offerId;
            return (
              <label key={course.offerId} className={`block cursor-pointer rounded-2xl border-2 bg-white p-5 shadow-sm transition ${selected ? 'border-[#b9894d] ring-2 ring-[#b9894d]/20' : 'border-transparent'}`}>
                <span className="flex items-start gap-4">
                  <input className="mt-1 h-5 w-5 accent-[#8a5d2e]" type="radio" name="offerId" value={course.offerId} checked={selected} onChange={() => setOfferId(course.offerId)} />
                  <span className="flex-1">
                    <span className="block text-xl font-bold leading-tight">{course.title}</span>
                    <span className="mt-2 block text-sm font-semibold uppercase tracking-wider text-[#72562f]">{course.delivery.join(' + ')} training</span>
                  </span>
                  <span className="text-right">
                    {course.compareAtPriceCad ? (
                      <span className="block text-sm font-semibold text-[#7b6b5e] line-through">
                        Regular ${course.compareAtPriceCad.toLocaleString('en-CA')}
                      </span>
                    ) : null}
                    {course.saleLabel ? (
                      <span className="block text-xs font-black uppercase tracking-wider text-[#8b1229]">
                        {course.saleLabel}
                      </span>
                    ) : null}
                    <span className="block font-serif text-2xl">
                      {course.compareAtPriceCad ? 'Sale ' : ''}${course.priceCad.toLocaleString('en-CA')}
                    </span>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="rounded-3xl bg-[#641f31] p-6 text-white shadow-xl sm:p-8">
        <h2 className="font-serif text-3xl">2. Your information</h2>
        <p className="mt-2 text-sm leading-6 text-[#f1dfe3]">Use the email you want connected to your course access.</p>
        <label className="mt-6 block font-bold" htmlFor="enrollment-name">Full name</label>
        <input id="enrollment-name" name="name" autoComplete="name" required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/30 bg-white px-4 text-[#17130f]" />
        <label className="mt-5 block font-bold" htmlFor="enrollment-email">Email address</label>
        <input id="enrollment-email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/30 bg-white px-4 text-[#17130f]" />
        {error ? <p role="alert" className="mt-4 rounded-xl bg-white p-3 font-semibold text-[#8b1229]">{error}</p> : null}
        <button type="submit" disabled={submitting || !offerId} className="mt-6 min-h-14 w-full rounded-full bg-[#c39851] px-5 text-lg font-black text-[#17130f] disabled:cursor-wait disabled:opacity-60">
          {submitting ? 'Opening secure checkout…' : 'Continue to secure checkout'}
        </button>
        <p className="mt-4 text-center text-xs leading-5 text-[#f1dfe3]">Payment is processed securely by Stripe. Your course access is created after payment is confirmed.</p>
      </div>
    </form>
  );
}
