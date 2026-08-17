'use client';

import { useCallback, useEffect, useState } from 'react';
import './amanda-deliveries.css';

type Delivery = {
  id: string;
  recipientEmail: string;
  recipientName: string;
  title: string;
  kind: 'recording' | 'photo' | 'graphic' | 'document' | 'other';
  note?: string;
  deliveredAt: string;
  openedAt?: string;
};

const EMPTY_FORM = {
  recipientName: '',
  recipientEmail: '',
  title: '',
  kind: 'recording' as Delivery['kind'],
  url: '',
  note: '',
  audience: 'media-guest',
};

export default function AmandaDeliveryCenter({ isAdmin, email }: { isAdmin: boolean; email: string }) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portal/amanda/deliveries', { cache: 'no-store' });
      const data = await res.json() as { ok?: boolean; error?: string; deliveries?: Delivery[] };
      if (!res.ok || !data.ok) throw new Error(data.error || 'Deliveries could not be loaded.');
      setDeliveries(data.deliveries || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Deliveries could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function deliver() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/portal/amanda/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json() as {
        ok?: boolean;
        error?: string;
        access?: { created?: boolean; welcomeSent?: boolean };
      };
      if (!res.ok || !data.ok) throw new Error(data.error || 'The delivery could not be completed.');
      setMessage(data.access?.created
        ? 'Delivered. Private portal access was created and the Amanda Catherine welcome email was sent.'
        : 'Delivered to the client’s existing private portal.');
      setForm(EMPTY_FORM);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The delivery could not be completed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ak-delivery-center">
      {isAdmin ? (
        <section className="ak-delivery-compose" aria-labelledby="ak-new-delivery-title">
          <div>
            <p className="ak-delivery-eyebrow">PRIVATE CLIENT DELIVERY</p>
            <h2 id="ak-new-delivery-title">Send finished work to a client</h2>
            <p>Assign the file to the client’s email. If they do not have access yet, their private portal and welcome email are created automatically.</p>
          </div>
          <div className="ak-delivery-form">
            <label><span>Client name</span><input value={form.recipientName} onChange={(event) => setForm({ ...form, recipientName: event.target.value })} placeholder="Client’s full name" /></label>
            <label><span>Client email</span><input type="email" value={form.recipientEmail} onChange={(event) => setForm({ ...form, recipientEmail: event.target.value })} placeholder="client@example.com" /></label>
            <label><span>Delivery title</span><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="LIFELINE interview clips" /></label>
            <label><span>Type</span><select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as Delivery['kind'] })}><option value="recording">Recording</option><option value="photo">Photos</option><option value="graphic">Graphics</option><option value="document">Document</option><option value="other">Other</option></select></label>
            <label><span>Client path</span><select value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })}><option value="media-guest">LIFELINE media client</option><option value="client">AesthetiKine client</option><option value="student-trainee">Student or trainee</option><option value="member-community-participant">Community member</option></select></label>
            <label className="ak-delivery-wide"><span>Private file or folder link</span><input type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://…" /></label>
            <label className="ak-delivery-wide"><span>Client note</span><textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="What this delivery includes and what the client should do next" /></label>
          </div>
          <button type="button" className="ak-delivery-button" onClick={() => void deliver()} disabled={saving}>{saving ? 'Creating access and delivering…' : 'Deliver to private portal'}</button>
        </section>
      ) : (
        <section className="ak-delivery-client-intro">
          <p className="ak-delivery-eyebrow">YOUR PRIVATE LIBRARY</p>
          <h2>Your recordings, files and finished work</h2>
          <p>Only items assigned to <strong>{email}</strong> appear here.</p>
        </section>
      )}

      {message ? <p className="ak-delivery-success" role="status">{message}</p> : null}
      {error ? <p className="ak-delivery-error" role="alert">{error}</p> : null}

      <section className="ak-delivery-list" aria-labelledby="ak-deliveries-title">
        <div className="ak-delivery-list-head"><div><p className="ak-delivery-eyebrow">{isAdmin ? 'DELIVERY TRACKING' : 'READY FOR YOU'}</p><h2 id="ak-deliveries-title">{isAdmin ? 'Client deliveries' : 'Your deliveries'}</h2></div><span>{deliveries.length} item{deliveries.length === 1 ? '' : 's'}</span></div>
        {loading ? <p>Loading private deliveries…</p> : null}
        {!loading && deliveries.length === 0 ? <div className="ak-delivery-empty"><strong>No deliveries yet.</strong><p>{isAdmin ? 'Finished work will appear here after you assign it to a client.' : 'Amanda will place recordings, photos, graphics and documents here when they are ready.'}</p></div> : null}
        <div className="ak-delivery-grid">
          {deliveries.map((delivery) => (
            <article key={delivery.id} className="ak-delivery-card">
              <div className="ak-delivery-card-top"><span>{delivery.kind}</span><small>{delivery.openedAt ? 'Opened' : 'New'}</small></div>
              <h3>{delivery.title}</h3>
              {isAdmin ? <p className="ak-delivery-recipient">{delivery.recipientName} · {delivery.recipientEmail}</p> : null}
              {delivery.note ? <p>{delivery.note}</p> : null}
              <footer><time>{new Date(delivery.deliveredAt).toLocaleDateString()}</time><a href={`/api/portal/amanda/deliveries/${delivery.id}/open`} target="_blank" rel="noreferrer">Open delivery <span aria-hidden>↗</span></a></footer>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
