'use client';

import { useEffect, useState } from 'react';

type Letter = { type: 'live' | 'waitlist'; subject: string; body_html: string; editable: boolean };

export default function AmandaLettersEditor() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [status, setStatus] = useState('Loading confirmation letters…');
  const [busy, setBusy] = useState(false);
  async function load() {
    const response = await fetch('/api/admin/letters', { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'Could not load letters.');
    setLetters(payload.letters || []);
    setStatus('');
  }
  useEffect(() => { void load().catch((error) => setStatus(error.message)); }, []);
  function update(type: Letter['type'], key: 'subject' | 'body_html', value: string) {
    setLetters((current) => current.map((letter) => letter.type === type ? { ...letter, [key]: value } : letter));
  }
  async function save(letter: Letter) {
    setBusy(true);
    setStatus('Saving…');
    try {
      const response = await fetch('/api/admin/letters', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(letter),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Could not save letter.');
      setLetters((current) => current.map((item) => item.type === letter.type ? payload.letter : item));
      setStatus(`${letter.type === 'live' ? 'Live registration' : 'Waitlist'} letter saved.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save letter.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="grid gap-8">
      <header><p className="text-xs font-bold uppercase tracking-[0.16em]">Amanda Catherine</p><h1 className="font-serif text-4xl">Confirmation letters</h1><p>Edit the message shown after a live registration or waitlist submission. Supported variables: {{first_name}}, {{class_name}}.</p></header>
      {letters.map((letter) => <article key={letter.type} className="grid gap-3 rounded-lg border bg-white p-5">
        <h2 className="font-serif text-2xl">{letter.type === 'live' ? 'Live registration' : 'Waitlist'}</h2>
        <label className="grid gap-1">Subject<input value={letter.subject} onChange={(event) => update(letter.type, 'subject', event.target.value)} /></label>
        <label className="grid gap-1">Message HTML<textarea rows={10} value={letter.body_html} onChange={(event) => update(letter.type, 'body_html', event.target.value)} /></label>
        <button type="button" className="rounded bg-[#17211c] px-4 py-3 font-bold text-white" onClick={() => void save(letter)} disabled={busy}>Save {letter.type} letter</button>
      </article>)}
      <p role="status">{status}</p>
    </section>
  );
}
