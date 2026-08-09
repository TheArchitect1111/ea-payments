'use client';

import { useState, type FormEvent } from 'react';

type Props = {
  initialUrl?: string;
  providerLabel?: string;
};

export default function BookingUrlPanel({ initialUrl = '', providerLabel = 'booking' }: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNote('');
    try {
      const res = await fetch('/api/portal/org/booking-url', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingUrl: url.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || 'Could not save booking URL.');
        return;
      }
      setNote('Booking URL saved — calendar tab will embed it for members.');
    } catch {
      setError('Network error — try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="ep-module-card" onSubmit={onSave} style={{ marginBottom: 24 }}>
      <p className="ep-module-card-title">Advisor booking URL</p>
      <p className="ep-module-card-note">
        Paste the {providerLabel} booking-page URL. Members see it on the Calendar tab.
      </p>
      <label className="ep-form-field">
        <span>Booking URL</span>
        <input
          className="ep-input"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={providerLabel === 'Jane' ? 'https://your-clinic.janeapp.com' : 'https://calendly.com/your-team/intro'}
        />
      </label>
      {error ? <p className="ep-module-card-note" style={{ color: '#b42318' }}>{error}</p> : null}
      {note ? <p className="ep-module-card-note">{note}</p> : null}
      <p style={{ marginTop: 12 }}>
        <button type="submit" className="ep-btn" disabled={busy}>
          {busy ? 'Saving…' : 'Save booking URL'}
        </button>
      </p>
    </form>
  );
}
