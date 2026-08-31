'use client';

import { useState } from 'react';

export default function TarrisFileCabinetIntakePage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('Verifying and publishing the approved file…');
    setShareUrl('');

    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/file-cabinet/intake/tarris-bouie-MuPLKEmqQeJ', {
      method: 'POST',
      body: form,
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      setMessage(result.error || 'Upload failed.');
      setBusy(false);
      return;
    }

    setMessage(`Verified: ${result.bytes.toLocaleString()} bytes, exact approved-file match.`);
    setShareUrl(result.shareUrl);
    setBusy(false);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f7f7f5', color: '#141414', padding: '48px 20px', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 720, margin: '0 auto', background: '#fff', borderRadius: 28, padding: 36, boxShadow: '0 18px 55px rgba(0,0,0,.08)' }}>
        <div style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: '#666', marginBottom: 16 }}>Efficiency Architects · File Cabinet</div>
        <h1 style={{ fontSize: 38, lineHeight: 1.05, margin: '0 0 14px' }}>Publish Tarris agreement</h1>
        <p style={{ fontSize: 18, lineHeight: 1.55, color: '#555', margin: '0 0 28px' }}>
          This intake accepts only the already-approved Tarris Bouie agreement. The file is fingerprint-checked before and after private storage. It is not converted or rebuilt.
        </p>

        <form onSubmit={submit}>
          <input
            type="file"
            name="file"
            accept="application/pdf,.pdf"
            required
            disabled={busy}
            style={{ width: '100%', padding: 18, border: '1px solid #d9d9d5', borderRadius: 16, background: '#fafafa', marginBottom: 16, fontSize: 16 }}
          />
          <button
            type="submit"
            disabled={busy}
            style={{ width: '100%', border: 0, borderRadius: 16, padding: '17px 22px', background: '#111', color: '#fff', fontSize: 17, fontWeight: 700, cursor: busy ? 'wait' : 'pointer', opacity: busy ? .65 : 1 }}
          >
            {busy ? 'Verifying…' : 'Generate Share Link'}
          </button>
        </form>

        {message && <p style={{ marginTop: 22, fontSize: 16, lineHeight: 1.5 }}>{message}</p>}
        {shareUrl && (
          <div style={{ marginTop: 18, padding: 18, borderRadius: 16, background: '#f2f2ef' }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Permanent share link</div>
            <a href={shareUrl} target="_blank" rel="noreferrer" style={{ color: '#111', fontWeight: 700, wordBreak: 'break-all' }}>{shareUrl}</a>
          </div>
        )}
      </section>
    </main>
  );
}
