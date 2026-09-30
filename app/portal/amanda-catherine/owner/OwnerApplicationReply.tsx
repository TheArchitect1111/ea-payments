'use client';

import { useRef, useState } from 'react';
import type { AmandaApplicationCommunication } from '@/lib/amanda-catherine/application-communication';

export default function OwnerApplicationReply({ submissionId, initial }: { submissionId: string; initial: AmandaApplicationCommunication[] }) {
  const [history, setHistory] = useState(initial);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const messageId = useRef('');
  return <section><h4>Communication history</h4>{history.map((item) => <p key={item.id}><strong>{item.subject}</strong> · {item.status}{item.sentAt ? ` · ${new Date(item.sentAt).toLocaleString()}` : ''}<br />{item.message}</p>)}<form onSubmit={async (event) => {
    event.preventDefault(); if (busy) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (!messageId.current) messageId.current = crypto.randomUUID();
    setBusy(true); setStatus('Sending…');
    try {
      const response = await fetch('/api/portal/amanda/application-reply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionId, messageId: messageId.current, subject: form.get('subject'), message: form.get('message') }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Follow-up could not be sent.');
      setHistory((current) => [...current.filter((item) => item.id !== data.communication.id), data.communication]);
      setStatus('Follow-up sent and recorded.'); formElement.reset(); messageId.current = '';
    } catch (cause) { setStatus(cause instanceof Error ? cause.message : 'Follow-up could not be sent.'); }
    finally { setBusy(false); }
  }}><label>Subject <input name="subject" required maxLength={180} /></label><label>Message <textarea name="message" required maxLength={5000} /></label><button type="submit" disabled={busy}>Send and record follow-up</button><p role="status">{status}</p></form></section>;
}
