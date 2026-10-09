'use client';

import { useEffect, useState } from 'react';

type Item = { id: string; title: string; url: string; type: 'image' | 'video'; sort_order: number; is_visible: boolean };

export default function AmandaMediaManager({ slug }: { slug: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const response = await fetch(`/api/portal/amanda/media?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
    const payload = await response.json();
    if (response.ok && payload.ok) setItems(payload.media || []);
  }
  useEffect(() => { void refresh().catch(() => setStatus('Media library is unavailable.')); }, [slug]);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    setStatus('Uploading…');
    try {
      const response = await fetch(`/api/portal/amanda/media?slug=${encodeURIComponent(slug)}`, { method: 'POST', body: form });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Upload failed.');
      setTitle('');
      formElement.reset();
      await refresh();
      setStatus('Media uploaded and added to the live library.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: Item) {
    const response = await fetch(`/api/portal/amanda/media?slug=${encodeURIComponent(slug)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, is_visible: !item.is_visible }),
    });
    if (response.ok) await refresh();
  }

  return (
    <section className="ak-editor-section" aria-label="Amanda public media library">
      <h2 className="px-5 pt-5 font-serif text-2xl">Media library</h2>
      <form onSubmit={upload} className="grid gap-3 p-5 md:grid-cols-2">
        <label className="ak-editor-field">Title<input name="title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required /></label>
        <label className="ak-editor-field">Image or video<input name="file" type="file" accept="image/*,video/*" required /></label>
        <label className="ak-editor-field">Display order<input name="sort_order" type="number" defaultValue="0" /></label>
        <label className="flex items-center gap-2"><input name="is_visible" type="checkbox" defaultChecked /> Visible on public site</label>
        <button className="ak-editor-primary md:col-span-2" type="submit" disabled={busy}>{busy ? 'Uploading…' : 'Upload to media library'}</button>
        <p role="status" className="md:col-span-2">{status}</p>
      </form>
      <ul className="grid gap-3 p-5 md:grid-cols-2">
        {items.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 border p-3">
          <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
          <button type="button" className="ak-editor-secondary" onClick={() => void toggle(item)}>{item.is_visible ? 'Hide' : 'Show'}</button>
        </li>)}
      </ul>
    </section>
  );
}
