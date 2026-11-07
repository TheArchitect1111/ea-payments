'use client';
import { useState } from 'react';

export default function AyfCustomerAssignments() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return <form className="ep-module-card" onSubmit={async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage('');
    try {
      const staffEmails = String(form.get('staffEmails') || '').split(',').map(value => value.trim()).filter(Boolean);
      const response = await fetch('/api/portal/ayf/customer-access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: form.get('customerEmail'), staffEmails }),
      });
      if (!response.ok) throw Error('Assignment update denied. Check active customer and staff memberships.');
      setMessage('Customer staff assignments saved.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Assignment update failed.'); }
    finally { setBusy(false); }
  }}>
    <h2 className="ep-module-card-title">Assign customer staff</h2>
    <p>Replace the staff assigned to this customer. Leave staff emails empty to remove all staff access. This does not create accounts or send messages.</p>
    <label>Customer email<input type="email" name="customerEmail" required autoComplete="off" /></label>
    <label>Assigned staff emails, separated by commas<input name="staffEmails" autoComplete="off" /></label>
    <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Replace staff assignments'}</button>
    {message ? <p role="status">{message}</p> : null}
  </form>;
}
