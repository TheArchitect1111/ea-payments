'use client';

import { useState } from 'react';
import {
  ACTIVE_SAVE_PURPOSES,
  defaultDueDateForPurpose,
  type ActiveSavePurpose,
} from '@/lib/active-save';
import './active-save-panel.css';

export default function ActiveSavePanel({
  recordId,
  title,
  onSaved,
  onSkip,
}: {
  recordId: string;
  title: string;
  onSaved?: () => void;
  onSkip?: () => void;
}) {
  const [purpose, setPurpose] = useState<ActiveSavePurpose>('potential-opportunity');
  const [dueDate, setDueDate] = useState(defaultDueDateForPurpose('potential-opportunity'));
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);

  const handlePurposeChange = (next: ActiveSavePurpose) => {
    setPurpose(next);
    setDueDate(defaultDueDateForPurpose(next));
  };

  const submit = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/portal/captures/active-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, purpose, dueDate, reason }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setMessage(data.error ?? 'Could not save.');
        return;
      }
      setSaved(true);
      onSaved?.();
    } catch {
      setMessage('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <div className="asv-panel asv-saved">
        <p className="asv-eyebrow">Active Save™</p>
        <p className="asv-title">Saved with purpose</p>
        <p className="asv-body">
          <strong>{title}</strong> will stay on your radar until {dueDate}.
        </p>
      </div>
    );
  }

  return (
    <div className="asv-panel">
      <p className="asv-eyebrow">Active Save™</p>
      <p className="asv-title">Keep this alive</p>
      <p className="asv-body">Every save needs a purpose and a revisit date — no passive graveyards.</p>

      <label className="asv-label" htmlFor="asv-purpose">
        Purpose
      </label>
      <select
        id="asv-purpose"
        className="asv-select"
        value={purpose}
        onChange={(e) => handlePurposeChange(e.target.value as ActiveSavePurpose)}
      >
        {ACTIVE_SAVE_PURPOSES.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      <label className="asv-label" htmlFor="asv-due">
        Target date
      </label>
      <input
        id="asv-due"
        type="date"
        className="asv-input"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />

      <label className="asv-label" htmlFor="asv-reason">
        Why it matters (optional)
      </label>
      <textarea
        id="asv-reason"
        className="asv-textarea"
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="One line — future you will thank you"
      />

      {message && <p className="asv-error">{message}</p>}

      <div className="asv-actions">
        <button type="button" className="asv-btn asv-btn-primary" disabled={loading} onClick={submit}>
          {loading ? 'Saving…' : 'Active Save'}
        </button>
        {onSkip && (
          <button type="button" className="asv-btn asv-btn-ghost" onClick={onSkip}>
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
