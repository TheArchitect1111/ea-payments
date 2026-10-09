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
    <form onSubmit={submit} aria-busy={busy} className="grid gap-3">
      <label htmlFor={`${id}-name`}>Name</label>
      <input id={`${id}-name`} name="name" autoComplete="name" required minLength={2} maxLength={120} />
      <label htmlFor={`${id}-email`}>Email</label>
      <input id={`${id}-email`} name="email" type="email" autoComplete="email" required maxLength={254} />
      <label htmlFor={`${id}-phone`}>Phone</label>
      <input id={`${id}-phone`} name="phone" type="tel" autoComplete="tel" maxLength={40} />
      <label htmlFor={`${id}-course`}>Class</label>
      <input id={`${id}-course`} value={courseName} readOnly />
      <label htmlFor={`${id}-message`}>Message</label>
      <textarea id={`${id}-message`} name="message" maxLength={2000} />
      <button disabled={busy} type="submit">
        {busy ? 'Submitting…' : status.toUpperCase() === 'LIVE' ? 'Register' : 'Join Waitlist'}
      </button>
      <p role="status">{statusMessage}</p>
    </form>
  );
}
