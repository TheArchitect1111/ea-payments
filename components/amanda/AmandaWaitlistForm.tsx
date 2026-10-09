'use client';

import { useId, useState, type FormEvent } from 'react';
import ConfirmationLetter, { type ConfirmationLetterData } from './ConfirmationLetter';

export default function AmandaWaitlistForm({
  courseId,
  courseName,
  status = 'WAITLIST',
}: {
  courseId: string;
  courseName: string;
  status?: string;
}) {
  const id = useId();
  const [statusMessage, setStatusMessage] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationLetterData | null>(null);
  const [busy, setBusy] = useState(false);
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
    } catch {
      setStatusMessage('Your details could not be saved. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (confirmation) {
    return <ConfirmationLetter letter={confirmation} firstName={confirmation.first_name} className={courseName} />;
  }

  return (
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
      <button
        className="w-full rounded-xl bg-[#17211c] px-5 py-3 font-medium text-white shadow-sm transition hover:bg-[#27372d] focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:cursor-wait disabled:opacity-60"
        disabled={busy}
        type="submit"
      >
        {busy ? 'Submitting…' : status.toUpperCase() === 'LIVE' ? 'Enroll Now' : 'Join Waitlist'}
      </button>
      <p className="min-h-5 text-sm text-[#7a3128]" role="status" aria-live="polite">{statusMessage}</p>
    </form>
  );
}
