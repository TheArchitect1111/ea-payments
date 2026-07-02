'use client';

import { useState } from 'react';
import type { ConnectKit, ConnectKitLink } from '@/lib/connect-kit';

type Props = {
  kit: ConnectKit;
  canManage: boolean;
};

export default function ConnectKitClient({ kit, canManage }: Props) {
  const [eventName, setEventName] = useState('');
  const [repName, setRepName] = useState('');
  const [customLinks, setCustomLinks] = useState<ConnectKitLink[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const links = [...kit.links, ...customLinks];

  async function createEventQr(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/portal/connect/event-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName.trim(), rep: repName.trim() || undefined }),
      });
      const data = (await res.json()) as { ok?: boolean; link?: ConnectKitLink; error?: string };
      if (!res.ok || !data.link) throw new Error(data.error ?? 'Could not create event QR.');
      setCustomLinks((current) => [data.link!, ...current]);
      setEventName('');
      setRepName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create event QR.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ep-card" style={{ display: 'grid', gap: 20 }}>
      <div>
        <p className="ep-card-title">Your Connect kit</p>
        <p style={{ margin: 0, color: '#64748b', lineHeight: 1.6 }}>
          Share these links or print QR codes at events. Every scan opens your branded capture page.
        </p>
      </div>

      {canManage ? (
        <form onSubmit={(e) => void createEventQr(e)} style={{ display: 'grid', gap: 12 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>New event QR</p>
          <input
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Event name (e.g. Charlotte Tournament)"
            required
            className="ep-input"
          />
          <input
            value={repName}
            onChange={(e) => setRepName(e.target.value)}
            placeholder="Rep name (optional)"
            className="ep-input"
          />
          <button type="submit" disabled={busy} className="ep-pulse-cta" style={{ width: 'fit-content' }}>
            {busy ? 'Creating…' : 'Create event QR'}
          </button>
          {error ? <p style={{ color: '#b91c1c', margin: 0 }}>{error}</p> : null}
        </form>
      ) : (
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Ask your portal owner to create event QR codes.</p>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {links.map((link) => (
          <article key={`${link.id}-${link.url}`} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <img
                src={link.qrPath}
                alt={`${link.label} QR`}
                width={120}
                height={120}
                style={{ border: '1px solid #e2e8f0', background: '#fff' }}
              />
              <div style={{ flex: 1, minWidth: 220 }}>
                <p style={{ margin: 0, fontWeight: 800 }}>{link.label}</p>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>{link.note}</p>
                <p style={{ margin: '10px 0 0', fontSize: 13, wordBreak: 'break-all' }}>{link.url}</p>
                <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                  <a href={link.qrPath} download className="ep-pulse-cta" style={{ textDecoration: 'none', fontSize: 13 }}>
                    Download QR
                  </a>
                  <a href={link.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 700, color: '#1B2B4D' }}>
                    Open capture page
                  </a>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
