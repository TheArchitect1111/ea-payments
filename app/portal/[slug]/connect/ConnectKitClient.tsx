'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ConnectKit, ConnectKitLink } from '@/lib/connect-kit';

type ConnectCopy = {
  offerHeadline: string;
  resourceTitle: string;
  guideIntro: string;
  journeyIntro: string;
};

type Props = {
  kit: ConnectKit;
  canManage: boolean;
  canEditCopy: boolean;
  copy: ConnectCopy;
};

export default function ConnectKitClient({ kit, canManage, canEditCopy, copy: initialCopy }: Props) {
  const router = useRouter();
  const [eventName, setEventName] = useState('');
  const [repName, setRepName] = useState('');
  const [copy, setCopy] = useState(initialCopy);
  const [customLinks, setCustomLinks] = useState<ConnectKitLink[]>([]);
  const [busy, setBusy] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const links = [
    ...customLinks,
    ...kit.links.filter((link) => !customLinks.some((item) => item.id === link.id)),
  ];

  async function createEventQr(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/portal/connect/event-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName.trim(), rep: repName.trim() || undefined }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        link?: ConnectKitLink;
        error?: string;
        persisted?: boolean;
        warning?: string;
        created?: boolean;
      };
      if (!res.ok || !data.link) throw new Error(data.error ?? 'Could not create event QR.');
      if (!data.created) {
        setNotice('This event QR already exists — showing the saved link.');
      } else if (data.warning) {
        setNotice(data.warning);
      } else if (data.persisted) {
        setNotice('Event QR saved to your Connect kit.');
      }
      setCustomLinks((current) => {
        const without = current.filter((item) => item.id !== data.link!.id);
        return [data.link!, ...without];
      });
      setEventName('');
      setRepName('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create event QR.');
    } finally {
      setBusy(false);
    }
  }

  async function saveCopy(e: React.FormEvent) {
    e.preventDefault();
    if (!canEditCopy) return;
    setCopyBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/portal/connect/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copy),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        copy?: ConnectCopy;
        error?: string;
        warning?: string;
        persisted?: boolean;
      };
      if (!res.ok || !data.copy) throw new Error(data.error ?? 'Could not save copy.');
      setCopy(data.copy);
      setNotice(data.warning ?? (data.persisted ? 'Capture page copy saved.' : 'Copy updated for this session.'));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save copy.');
    } finally {
      setCopyBusy(false);
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

      {canEditCopy ? (
        <form onSubmit={(e) => void saveCopy(e)} style={{ display: 'grid', gap: 12, paddingTop: 4, borderTop: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>Capture page copy</p>
          <input
            value={copy.offerHeadline}
            onChange={(e) => setCopy((current) => ({ ...current, offerHeadline: e.target.value }))}
            placeholder="Offer headline"
            required
            className="ep-input"
          />
          <input
            value={copy.resourceTitle}
            onChange={(e) => setCopy((current) => ({ ...current, resourceTitle: e.target.value }))}
            placeholder="Resource title"
            required
            className="ep-input"
          />
          <textarea
            value={copy.guideIntro}
            onChange={(e) => setCopy((current) => ({ ...current, guideIntro: e.target.value }))}
            placeholder="Guide intro"
            rows={2}
            className="ep-input"
          />
          <textarea
            value={copy.journeyIntro}
            onChange={(e) => setCopy((current) => ({ ...current, journeyIntro: e.target.value }))}
            placeholder="Journey intro"
            rows={2}
            className="ep-input"
          />
          <button type="submit" disabled={copyBusy} className="ep-pulse-cta" style={{ width: 'fit-content' }}>
            {copyBusy ? 'Saving…' : 'Save capture copy'}
          </button>
        </form>
      ) : null}

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
          {notice ? <p style={{ color: '#047857', margin: 0 }}>{notice}</p> : null}
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
