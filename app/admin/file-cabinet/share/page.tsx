'use client';

import { useState } from 'react';

const TARRIS_SHA256 = '390ed4546f66522f1ed84ccecd95bc037b24acd87eee7288913c9288027ac667';
const TARRIS_SIZE = '1798727';
const TARRIS_SHARE_ID = 'tarris-bouie-MuPLKEmqQeJ';

export default function FileCabinetSharePage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [tarrisMode, setTarrisMode] = useState(true);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setShareUrl('');
    setMessage('Verifying source file and creating share link…');

    const form = new FormData(event.currentTarget);
    if (tarrisMode) {
      form.set('clientName', 'Tarris Bouie');
      form.set('shareId', TARRIS_SHARE_ID);
      form.set('expectedSize', TARRIS_SIZE);
      form.set('expectedSha256', TARRIS_SHA256);
    }

    const response = await fetch('/admin/api/file-cabinet/share', {
      method: 'POST',
      body: form,
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      setMessage(result.error || 'Share link could not be created.');
      setBusy(false);
      return;
    }

    setMessage(`Verified exact copy · ${result.bytes.toLocaleString()} bytes · SHA-256 matched after storage.`);
    setShareUrl(result.shareUrl);
    setBusy(false);
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setMessage('Share link copied. The stored file remains private; the EA share URL streams the verified original.');
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f6f6f3', color: '#111', padding: '52px 20px', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ fontSize: 13, letterSpacing: '.15em', textTransform: 'uppercase', color: '#71716b', marginBottom: 18 }}>Efficiency Architects · File Cabinet</div>
        <h1 style={{ fontSize: 44, letterSpacing: '-.035em', lineHeight: 1.02, margin: '0 0 14px' }}>Generate a share link.</h1>
        <p style={{ fontSize: 19, lineHeight: 1.55, color: '#55554f', maxWidth: 680, margin: '0 0 30px' }}>
          Publish an approved File Cabinet document without changing it. EA verifies the source bytes, stores the original privately, verifies the stored bytes again, then issues a permanent share URL.
        </p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setTarrisMode(true)} style={{ border: '1px solid #d4d4cf', borderRadius: 999, padding: '10px 15px', background: tarrisMode ? '#111' : '#fff', color: tarrisMode ? '#fff' : '#111', fontWeight: 700 }}>Tarris Bouie · approved contract</button>
          <button type="button" onClick={() => setTarrisMode(false)} style={{ border: '1px solid #d4d4cf', borderRadius: 999, padding: '10px 15px', background: !tarrisMode ? '#111' : '#fff', color: !tarrisMode ? '#fff' : '#111', fontWeight: 700 }}>Another File Cabinet document</button>
        </div>

        <form onSubmit={submit} style={{ background: '#fff', padding: 30, borderRadius: 26, boxShadow: '0 18px 55px rgba(0,0,0,.07)' }}>
          {!tarrisMode && (
            <label style={{ display: 'block', marginBottom: 18 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Client / project</span>
              <input name="clientName" required={!tarrisMode} placeholder="Client name" style={{ width: '100%', boxSizing: 'border-box', padding: 15, borderRadius: 14, border: '1px solid #d9d9d4', fontSize: 16 }} />
            </label>
          )}

          <label style={{ display: 'block', marginBottom: 18 }}>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{tarrisMode ? 'Approved Tarris contract' : 'Approved File Cabinet document'}</span>
            <input type="file" name="file" required disabled={busy} style={{ width: '100%', boxSizing: 'border-box', padding: 16, borderRadius: 14, border: '1px solid #d9d9d4', background: '#fafaf8', fontSize: 15 }} />
          </label>

          {tarrisMode && <div style={{ background: '#f4f4f1', borderRadius: 14, padding: 15, marginBottom: 18, fontSize: 14, lineHeight: 1.5, color: '#55554f' }}>Locked verification is on. EA will accept only the exact 1,798,727-byte approved Tarris agreement already registered as the source of truth.</div>}

          <button type="submit" disabled={busy} style={{ width: '100%', border: 0, borderRadius: 15, padding: '17px 20px', background: '#111', color: '#fff', fontSize: 17, fontWeight: 700, cursor: busy ? 'wait' : 'pointer', opacity: busy ? .65 : 1 }}>{busy ? 'Verifying…' : 'Generate Share Link'}</button>
        </form>

        {message && <p style={{ margin: '22px 2px 0', fontSize: 16, lineHeight: 1.55 }}>{message}</p>}
        {shareUrl && (
          <div style={{ marginTop: 18, background: '#fff', padding: 22, borderRadius: 20, border: '1px solid #e3e3de' }}>
            <div style={{ fontSize: 13, color: '#6b6b65', marginBottom: 8 }}>Permanent EA share link</div>
            <a href={shareUrl} target="_blank" rel="noreferrer" style={{ color: '#111', fontSize: 16, fontWeight: 700, wordBreak: 'break-all' }}>{shareUrl}</a>
            <button type="button" onClick={copyLink} style={{ marginTop: 14, border: 0, borderRadius: 12, padding: '12px 16px', background: '#ecece7', color: '#111', fontWeight: 700 }}>Copy link</button>
          </div>
        )}
      </section>
    </main>
  );
}
