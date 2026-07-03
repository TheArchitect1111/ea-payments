'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { MediaAsset, MediaAssetKind } from '@/lib/creative-studio/types';
import '../creative-studio.css';

const KINDS: MediaAssetKind[] = ['image', 'logo', 'document', 'video'];

export default function MediaLibraryClient() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [kind, setKind] = useState<MediaAssetKind>('image');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const res = await fetch('/api/creative-studio/media');
    const data = (await res.json()) as { media?: MediaAsset[]; error?: string };
    if (!res.ok) {
      setError(data.error ?? 'Could not load media library.');
      return;
    }
    setMedia(data.media ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addAsset(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    const res = await fetch('/api/creative-studio/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label,
        url,
        kind,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });
    const data = (await res.json()) as { ok?: boolean; asset?: MediaAsset; error?: string };
    setSaving(false);

    if (!res.ok || !data.asset) {
      setError(data.error ?? 'Could not save media asset.');
      return;
    }

    setMedia((prev) => [data.asset!, ...prev]);
    setLabel('');
    setUrl('');
    setTags('');
    setMessage(`Added “${data.asset.label}” to your library.`);
  }

  return (
    <main className="cs-page">
      <header className="cs-hero">
        <nav className="cs-subnav">
          <Link href="/admin/creative-studio">Campaigns</Link>
          <span className="cs-subnav-active">Media</span>
          <Link href="/admin/creative-studio/brand">Brand</Link>
        </nav>
        <p className="cs-kicker">EA Creative Studio™</p>
        <h1 className="cs-title">Media Library</h1>
        <p className="cs-lede">
          Store logos, images, and documents by URL — attach to campaigns and brand profiles as M3 rolls out.
        </p>
      </header>

      <section className="cs-section cs-panel">
        <h2 className="cs-section-title">Add media</h2>
        <form className="cs-brand-form" onSubmit={addAsset}>
          <label className="cs-field">
            <span>Label</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Spring gala hero" />
          </label>
          <label className="cs-field">
            <span>Public URL</span>
            <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </label>
          <label className="cs-field">
            <span>Kind</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as MediaAssetKind)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="cs-field">
            <span>Tags (comma-separated)</span>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="event, 2026" />
          </label>
          <button type="submit" className="cs-publish-btn" disabled={saving}>
            {saving ? 'Saving…' : 'Add to library'}
          </button>
        </form>
        {error ? <p className="cs-error">{error}</p> : null}
        {message ? <p className="cs-success">{message}</p> : null}
      </section>

      <section className="cs-section">
        <h2 className="cs-section-title">Library ({media.length})</h2>
        {media.length === 0 ? (
          <p className="cs-lede">No media yet — add a URL above or set a logo on the Brand page.</p>
        ) : (
          <ul className="cs-campaign-list">
            {media.map((item) => (
              <li key={item.id} className="cs-campaign-card">
                <p className="cs-campaign-card-title">{item.label}</p>
                <p className="cs-campaign-card-meta">
                  {item.kind} · {new Date(item.updatedAt).toLocaleDateString()}
                </p>
                <a href={item.url} className="cs-campaign-card-title" target="_blank" rel="noreferrer">
                  {item.url}
                </a>
                {item.tags.length ? <p className="cs-campaign-card-note">Tags: {item.tags.join(', ')}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
