'use client';

import { useState } from 'react';

export default function PasswordChangeModal() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (done) return null;

  async function submit() {
    setError('');
    if (password.length < 8) {
      setError('Please use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/portal/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'We could not update your password.');
        return;
      }
      setDone(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ep-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="password-title">
      <div className="ep-modal">
        <p className="ep-modal-label">First Login</p>
        <h2 id="password-title" className="ep-modal-title">Create Your New Password</h2>
        <p className="ep-modal-copy">
          This replaces your temporary password and keeps your portal access private.
        </p>
        <label className="ep-form-label" htmlFor="new-password">New Password</label>
        <input
          id="new-password"
          type="password"
          className="ep-form-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <label className="ep-form-label" htmlFor="confirm-password">Confirm New Password</label>
        <input
          id="confirm-password"
          type="password"
          className="ep-form-input"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
        {error && <p className="ep-form-error">{error}</p>}
        <button className="ep-primary-button" type="button" onClick={submit} disabled={saving}>
          {saving ? 'Saving...' : 'Save Password'}
        </button>
      </div>
    </div>
  );
}
