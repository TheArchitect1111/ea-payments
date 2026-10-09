'use client';

import { useMemo, useState } from 'react';

type RouteEntry = { path: string; label: string };
type PageEdit = { title: string; hero: string; content: string; links: string };
const buttonClass = 'min-h-20 w-full rounded-2xl border border-white/15 bg-[#171717] px-4 text-left text-sm font-bold text-white active:scale-[.99]';
const emptyEdit: PageEdit = { title: '', hero: '', content: '', links: '' };

export default function PhoneHq({ routes }: { routes: RouteEntry[] }) {
  const [query, setQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState('');
  const [edit, setEdit] = useState<PageEdit>(emptyEdit);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const filtered = useMemo(() => routes.filter(({ path, label }) => (path + ' ' + label).toLowerCase().includes(query.toLowerCase())), [routes, query]);

  async function selectPage(path: string) {
    setSelectedPath(path); setEdit(emptyEdit); setMessage('Loading saved fields…');
    try {
      const response = await fetch('/client/api/editor?path=' + encodeURIComponent(path), { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not load page.');
      setEdit({ ...emptyEdit, ...(body.edit ?? {}) });
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load page.');
    }
  }
  async function save() {
    if (!selectedPath) return;
    setBusy(true); setMessage('Saving and starting redeploy…');
    try {
      const response = await fetch('/client/api/editor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedPath, ...edit }),
      });
      const body = await response.json().catch(() => ({}));
      setMessage(response.ok ? 'Saved. Vercel redeploy started for ' + selectedPath + '.' : body.error || 'Save failed.');
    } catch {
      setMessage('Could not save. Check the connection and try again.');
    } finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#0a0a0a] px-4 pb-8 text-white">
    <header className="mx-auto flex min-h-20 max-w-xl items-center justify-between border-b border-white/10">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-white/50">My Projects HQ</p><h1 className="text-xl font-black">Fix Anything</h1></div>
      <a href="/admin" className="grid min-h-20 min-w-20 place-items-center rounded-xl border border-white/15 text-sm font-bold">Admin</a>
    </header>
    <section className="mx-auto grid max-w-xl gap-3 pt-4">
      <h2 className="text-2xl font-black">EDIT ANY PAGE</h2>
      <p className="text-sm text-white/60">Choose a page, make the change, and save.</p>
      <label className="grid gap-2 text-sm font-bold">Find a page
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search routes" className="min-h-20 rounded-xl border border-white/20 bg-[#171717] px-4 text-base text-white" />
      </label>
      <div className="grid max-h-[34dvh] gap-2 overflow-y-auto rounded-2xl border border-white/10 p-2" aria-label="Pages">
        {filtered.map((route) => <button key={route.path} type="button" onClick={() => void selectPage(route.path)} aria-pressed={selectedPath === route.path} className={buttonClass + (selectedPath === route.path ? ' border-[#df5a6c] bg-[#2a171a]' : '')}>
          <span className="block">{route.label}</span><span className="mt-1 block text-xs font-normal text-white/50">{route.path}</span>
        </button>)}
        {filtered.length === 0 && <p className="p-3 text-sm text-white/60">No matching pages.</p>}
      </div>
      {selectedPath && <section className="grid gap-3 rounded-2xl border border-white/10 bg-[#111] p-4">
        <h3 className="font-black">{selectedPath}</h3>
        <label className="grid gap-1 text-sm font-bold">Title<input value={edit.title} onChange={(event) => setEdit({ ...edit, title: event.target.value })} className="min-h-20 rounded-xl border border-white/20 bg-[#171717] px-3 text-base" /></label>
        <label className="grid gap-1 text-sm font-bold">Hero / Videos<input value={edit.hero} onChange={(event) => setEdit({ ...edit, hero: event.target.value })} placeholder="Image or video URL" className="min-h-20 rounded-xl border border-white/20 bg-[#171717] px-3 text-base" /></label>
        <label className="grid gap-1 text-sm font-bold">Content<textarea value={edit.content} onChange={(event) => setEdit({ ...edit, content: event.target.value })} rows={5} className="rounded-xl border border-white/20 bg-[#171717] p-3 text-base" /></label>
        <label className="grid gap-1 text-sm font-bold">Links<textarea value={edit.links} onChange={(event) => setEdit({ ...edit, links: event.target.value })} placeholder="One URL per line" rows={3} className="rounded-xl border border-white/20 bg-[#171717] p-3 text-base" /></label>
        <button type="button" disabled={busy} onClick={() => void save()} className="min-h-20 rounded-2xl bg-[#a51c30] px-4 font-black disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
        {message && <p role="status" className="text-sm text-white/70">{message}</p>}
      </section>}
    </section>
  </main>;
}
