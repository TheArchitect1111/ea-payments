'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import type { PortalPretixEvent } from '@/lib/events/pretix-types';

type Props = {
  initialEvents: PortalPretixEvent[];
};

export default function PretixEventStaffPanel({ initialEvents }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [title, setTitle] = useState('');
  const [shopUrl, setShopUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [pretixEventSlug, setPretixEventSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  async function refresh() {
    const res = await fetch('/api/portal/events/pretix', { credentials: 'include' });
    const data = (await res.json()) as { ok?: boolean; events?: PortalPretixEvent[]; error?: string };
    if (!res.ok || !data.ok) {
      setError(data.error || 'Could not refresh events.');
      return;
    }
    setEvents(data.events || []);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNote('');
    try {
      const res = await fetch('/api/portal/events/pretix', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          shopUrl,
          summary: summary || undefined,
          location: location || undefined,
          startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
          pretixEventSlug: pretixEventSlug || undefined,
          status: 'published',
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || 'Could not add event.');
        return;
      }
      setTitle('');
      setShopUrl('');
      setSummary('');
      setLocation('');
      setStartsAt('');
      setPretixEventSlug('');
      setNote('Event published to this portal’s Event Hub.');
      await refresh();
    } catch {
      setError('Network error — try again.');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: 'draft' | 'published' | 'closed') {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/portal/events/pretix', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || 'Could not update status.');
        return;
      }
      await refresh();
    } catch {
      setError('Network error — try again.');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('Remove this pretix event from the portal list?')) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/portal/events/pretix?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || 'Could not delete.');
        return;
      }
      await refresh();
    } catch {
      setError('Network error — try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ep-module-card" style={{ marginBottom: 28 }}>
      <h2 className="ep-module-card-title" style={{ marginBottom: 8 }}>
        Staff · pretix events
      </h2>
      <p className="ep-module-card-note" style={{ marginBottom: 16 }}>
        Paste the public pretix shop URL. Registration, payment, and confirmations stay in pretix —
        this hub deep-links clients and receives order webhooks into Pulse. On Vercel, prefer{' '}
        <code>PRETIX_EVENTS_JSON</code> for durable multi-instance config.
      </p>

      <form onSubmit={onCreate} style={{ display: 'grid', gap: 10, maxWidth: 560 }}>
        <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
          Event title
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summer Leadership Camp"
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
          pretix shop URL (https)
          <input
            required
            type="url"
            value={shopUrl}
            onChange={(e) => setShopUrl(e.target.value)}
            placeholder="https://pretix.eu/your-org/your-event/"
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
          Summary (optional)
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Two-day overnight camp — registration closes Friday"
            style={inputStyle}
          />
        </label>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
          <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
            Starts (optional)
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
            Location (optional)
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Campus gym"
              style={inputStyle}
            />
          </label>
        </div>
        <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
          pretix event slug (optional, for webhook match)
          <input
            value={pretixEventSlug}
            onChange={(e) => setPretixEventSlug(e.target.value)}
            placeholder="summer-camp-2026"
            style={inputStyle}
          />
        </label>
        <button type="submit" disabled={busy} className="ep-btn" style={{ justifySelf: 'start' }}>
          {busy ? 'Saving…' : 'Publish to Event Hub'}
        </button>
      </form>

      {error ? (
        <p style={{ color: '#b91c1c', marginTop: 12, fontSize: 14 }} role="alert">
          {error}
        </p>
      ) : null}
      {note ? (
        <p style={{ color: '#166534', marginTop: 12, fontSize: 14 }}>{note}</p>
      ) : null}

      {events.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', display: 'grid', gap: 12 }}>
          {events.map((event) => (
            <li
              key={event.id}
              style={{
                borderTop: '1px solid rgba(27, 43, 77, 0.12)',
                paddingTop: 12,
                fontSize: 14,
              }}
            >
              <strong>{event.title}</strong>{' '}
              <span style={{ color: '#64748b' }}>({event.status})</span>
              <div style={{ marginTop: 4, wordBreak: 'break-all' }}>
                <a href={event.shopUrl} target="_blank" rel="noreferrer">
                  {event.shopUrl}
                </a>
              </div>
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {event.status !== 'published' ? (
                  <button type="button" disabled={busy} onClick={() => setStatus(event.id, 'published')}>
                    Publish
                  </button>
                ) : null}
                {event.status !== 'closed' ? (
                  <button type="button" disabled={busy} onClick={() => setStatus(event.id, 'closed')}>
                    Close
                  </button>
                ) : null}
                {event.status !== 'draft' ? (
                  <button type="button" disabled={busy} onClick={() => setStatus(event.id, 'draft')}>
                    Draft
                  </button>
                ) : null}
                <button type="button" disabled={busy} onClick={() => onDelete(event.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ep-module-card-note" style={{ marginTop: 16 }}>
          No pretix events linked yet. Until one is published, Event Hub stays on reviews & bookings only.
        </p>
      )}
    </section>
  );
}

const inputStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(27, 43, 77, 0.2)',
  fontSize: 15,
};
