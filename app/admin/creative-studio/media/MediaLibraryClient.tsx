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
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [fileSizeMb, setFileSizeMb] = useState('');
  const [altText, setAltText] = useState('');
  const [rightsSource, setRightsSource] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
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

  async function addAsset(event: React.FormEvent) {
    event.preventDefault();
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
        mimeType,
        width: width ? Number(width) : undefined,
        height: height ? Number(height) : undefined,
        fileSizeBytes: fileSizeMb ? Math.round(Number(fileSizeMb) * 1024 * 1024) : undefined,
        altText,
        rightsConfirmed,
        rightsSource,
        publiclyReachable: true,
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      }),
    });
    const data = (await res.json()) as { ok?: boolean; asset?: MediaAsset; error?: string };
    setSaving(false);

    if (!res.ok || !data.asset) {
      setError(data.error ?? 'Could not save media asset.');
      return;
    }

    setMedia((current) => [data.asset!, ...current]);
    setLabel('');
    setUrl('');
    setWidth('');
    setHeight('');
    setFileSizeMb('');
    setAltText('');
    setRightsSource('');
    setRightsConfirmed(false);
    setTags('');
    setMessage(`Added “${data.asset.label}” as rights-cleared campaign media.`);
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
        <h1 className="cs-title">Campaign Media</h1>
        <p className="cs-lede">
          Register durable public media with dimensions, accessibility text, and usage rights before attaching it to
          Facebook or Instagram content.
        </p>
      </header>

      <section className="cs-section cs-panel">
        <h2 className="cs-section-title">Add campaign media</h2>
        <form className="cs-brand-form" onSubmit={addAsset}>
          <label className="cs-field">
            <span>Label</span>
            <input required value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Fall campaign hero" />
          </label>
          <label className="cs-field">
            <span>Public HTTPS URL</span>
            <input type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" />
          </label>
          <div className="cs-field-row">
            <label className="cs-field">
              <span>Kind</span>
              <select
                value={kind}
                onChange={(event) => {
                  const next = event.target.value as MediaAssetKind;
                  setKind(next);
                  setMimeType(next === 'video' ? 'video/mp4' : 'image/jpeg');
                }}
              >
                {KINDS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="cs-field">
              <span>MIME type</span>
              <input value={mimeType} onChange={(event) => setMimeType(event.target.value)} placeholder="image/jpeg" />
            </label>
          </div>
          <div className="cs-field-row">
            <label className="cs-field">
              <span>Width in pixels</span>
              <input type="number" min="1" value={width} onChange={(event) => setWidth(event.target.value)} />
            </label>
            <label className="cs-field">
              <span>Height in pixels</span>
              <input type="number" min="1" value={height} onChange={(event) => setHeight(event.target.value)} />
            </label>
            <label className="cs-field">
              <span>File size in MB</span>
              <input type="number" min="0" step="0.1" value={fileSizeMb} onChange={(event) => setFileSizeMb(event.target.value)} />
            </label>
          </div>
          <label className="cs-field">
            <span>Alternative text</span>
            <textarea
              required={kind === 'image'}
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Describe what is visible and meaningful in the image."
            />
          </label>
          <label className="cs-field">
            <span>Media owner or rights source</span>
            <input
              required
              value={rightsSource}
              onChange={(event) => setRightsSource(event.target.value)}
              placeholder="EA-owned photo; photographer release dated…"
            />
          </label>
          <label className="cs-rights-confirm">
            <input
              type="checkbox"
              checked={rightsConfirmed}
              onChange={(event) => setRightsConfirmed(event.target.checked)}
            />
            I confirm EA or the client has permission to publish this media.
          </label>
          <label className="cs-field">
            <span>Tags — separate with commas</span>
            <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="campaign, fall, registration" />
          </label>
          <button type="submit" className="cs-publish-btn" disabled={saving || !rightsConfirmed}>
            {saving ? 'Validating…' : 'Add validated media'}
          </button>
        </form>
        {error ? <p className="cs-error">{error}</p> : null}
        {message ? <p className="cs-success">{message}</p> : null}
      </section>

      <section className="cs-section">
        <h2 className="cs-section-title">Library ({media.length})</h2>
        {media.length === 0 ? (
          <p className="cs-lede">No campaign-ready media has been added.</p>
        ) : (
          <ul className="cs-campaign-list">
            {media.map((item) => (
              <li key={item.id} className="cs-campaign-card">
                <p className="cs-campaign-card-title">{item.label}</p>
                <p className="cs-campaign-card-meta">
                  {item.kind}
                  {item.width && item.height ? ` · ${item.width}×${item.height}` : ''}
                  {item.rightsConfirmed ? ' · Rights confirmed' : ' · Rights missing'}
                </p>
                <a href={item.url} className="cs-campaign-card-title" target="_blank" rel="noreferrer">
                  {item.url}
                </a>
                {item.altText ? <p className="cs-campaign-card-note">Alt text: {item.altText}</p> : null}
                {item.rightsSource ? <p className="cs-campaign-card-note">Rights: {item.rightsSource}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
