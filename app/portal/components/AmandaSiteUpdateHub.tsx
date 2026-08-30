'use client';

import { useMemo, useState } from 'react';
import type { AmandaSiteContent } from '@/lib/amanda-catherine/site-content';

type Props = {
  slug: string;
  initialContent: AmandaSiteContent;
};

type MediaTarget =
  | 'hero.imageUrl'
  | 'hero.videoUrl'
  | 'about.imageUrl'
  | 'restore.imageUrl'
  | 'learn.imageUrl'
  | 'create.imageUrl'
  | 'impact.imageUrl';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export default function AmandaSiteUpdateHub({ slug, initialContent }: Props) {
  const [content, setContent] = useState<AmandaSiteContent>(() => clone(initialContent));
  const [status, setStatus] = useState('All changes are local until you publish.');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<MediaTarget | null>(null);
  const previewUrl = useMemo(() => '/amanda-catherine', []);

  function update(path: string, value: string) {
    setContent((current) => {
      const next = clone(current) as unknown as Record<string, unknown>;
      const keys = path.split('.');
      let cursor = next;
      for (let i = 0; i < keys.length - 1; i += 1) {
        cursor = cursor[keys[i]] as Record<string, unknown>;
      }
      cursor[keys[keys.length - 1]] = value;
      return next as unknown as AmandaSiteContent;
    });
    setStatus('Unpublished changes');
  }

  async function upload(target: MediaTarget, file?: File) {
    if (!file) return;
    setUploading(target);
    setStatus(`Uploading ${file.type.startsWith('video/') ? 'video' : 'image'}…`);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(`/api/portal/amanda/site-media?slug=${encodeURIComponent(slug)}`, {
        method: 'POST',
        body: form,
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok || !payload.url) {
        setStatus(payload.error ?? 'Upload failed.');
        return;
      }
      update(target, payload.url);
      setStatus('Media uploaded. Publish to make it live.');
    } catch {
      setStatus('Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  }

  async function publish() {
    setBusy(true);
    setStatus('Publishing…');
    try {
      const response = await fetch('/api/portal/amanda/site-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, content }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setStatus(payload.error ?? 'Publish failed.');
        return;
      }
      setContent(payload.content);
      setStatus(payload.persisted ? 'Published and durably saved.' : 'Published. Durable storage is not connected.');
    } catch {
      setStatus('Publish failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const field = (label: string, path: string, value: string, multiline = false) => (
    <label className="ak-editor-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => update(path, event.target.value)} rows={4} />
      ) : (
        <input value={value} onChange={(event) => update(path, event.target.value)} />
      )}
    </label>
  );

  const media = (label: string, target: MediaTarget, value: string, accept: string) => (
    <div className="ak-editor-field">
      <span>{label}</span>
      <div className="ak-media-row">
        <input value={value} onChange={(event) => update(target, event.target.value)} placeholder="Paste a media URL or upload a file" />
        <label className="ak-upload-button">
          {uploading === target ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept={accept}
            disabled={Boolean(uploading)}
            onChange={(event) => void upload(target, event.target.files?.[0])}
          />
        </label>
      </div>
    </div>
  );

  return (
    <section className="ak-site-editor" aria-label="Amanda Catherine website update hub">
      <div className="ak-editor-topbar">
        <div>
          <p className="ak-editor-kicker">Update Hub™ · AmandaCatherine.ca</p>
          <h1>Edit your website</h1>
          <p>Change copy, links, photos and videos here. Publish once when you are ready.</p>
        </div>
        <div className="ak-editor-actions">
          <a href={previewUrl} target="_blank" rel="noreferrer" className="ak-editor-secondary">Preview</a>
          <button type="button" onClick={() => void publish()} disabled={busy} className="ak-editor-primary">
            {busy ? 'Publishing…' : 'Publish changes'}
          </button>
        </div>
      </div>

      <div className="ak-editor-status" role="status">{status}</div>

      <details open className="ak-editor-section">
        <summary>Hero</summary>
        <div className="ak-editor-grid">
          {field('Eyebrow', 'hero.eyebrow', content.hero.eyebrow)}
          {field('Headline', 'hero.title', content.hero.title)}
          {field('Intro copy', 'hero.subtitle', content.hero.subtitle, true)}
          {field('Primary button label', 'hero.primaryLabel', content.hero.primaryLabel)}
          {field('Primary button link', 'hero.primaryHref', content.hero.primaryHref)}
          {field('Secondary button label', 'hero.secondaryLabel', content.hero.secondaryLabel)}
          {field('Secondary button link', 'hero.secondaryHref', content.hero.secondaryHref)}
          {media('Hero image', 'hero.imageUrl', content.hero.imageUrl, 'image/*')}
          {media('Hero video', 'hero.videoUrl', content.hero.videoUrl, 'video/*')}
        </div>
      </details>

      <details open className="ak-editor-section">
        <summary>Introduction</summary>
        <div className="ak-editor-grid">
          {field('Eyebrow', 'intro.eyebrow', content.intro.eyebrow)}
          {field('Headline', 'intro.title', content.intro.title)}
          {field('Body', 'intro.body', content.intro.body, true)}
        </div>
      </details>

      <details open className="ak-editor-section">
        <summary>Meet Amanda</summary>
        <div className="ak-editor-grid">
          {field('Headline', 'about.title', content.about.title)}
          {field('Biography', 'about.body', content.about.body, true)}
          {field('Additional biography', 'about.secondaryBody', content.about.secondaryBody, true)}
          {media('About image', 'about.imageUrl', content.about.imageUrl, 'image/*')}
        </div>
      </details>

      <details className="ak-editor-section">
        <summary>Pathways</summary>
        <div className="ak-editor-grid">
          {field('Headline', 'pathways.title', content.pathways.title)}
          {field('Intro', 'pathways.body', content.pathways.body, true)}
          {field('Restore pathway', 'pathways.restoreBody', content.pathways.restoreBody, true)}
          {field('Learn pathway', 'pathways.learnBody', content.pathways.learnBody, true)}
          {field('Create pathway', 'pathways.createBody', content.pathways.createBody, true)}
        </div>
      </details>

      <details className="ak-editor-section">
        <summary>Restore</summary>
        <div className="ak-editor-grid">
          {field('Headline', 'restore.title', content.restore.title)}
          {field('Body', 'restore.body', content.restore.body, true)}
          {media('Restore image', 'restore.imageUrl', content.restore.imageUrl, 'image/*')}
        </div>
      </details>

      <details className="ak-editor-section">
        <summary>Learn</summary>
        <div className="ak-editor-grid">
          {field('Headline', 'learn.title', content.learn.title)}
          {field('Body', 'learn.body', content.learn.body, true)}
          {media('Learn image', 'learn.imageUrl', content.learn.imageUrl, 'image/*')}
        </div>
      </details>

      <details className="ak-editor-section">
        <summary>Create</summary>
        <div className="ak-editor-grid">
          {field('Headline', 'create.title', content.create.title)}
          {field('Body', 'create.body', content.create.body, true)}
          {media('Create image', 'create.imageUrl', content.create.imageUrl, 'image/*')}
        </div>
      </details>

      <details className="ak-editor-section">
        <summary>Impact, speaking & media</summary>
        <div className="ak-editor-grid">
          {field('Headline', 'impact.title', content.impact.title)}
          {field('Body', 'impact.body', content.impact.body, true)}
          {media('Impact image', 'impact.imageUrl', content.impact.imageUrl, 'image/*')}
        </div>
      </details>

      <details className="ak-editor-section">
        <summary>Contact & booking</summary>
        <div className="ak-editor-grid">
          {field('Headline', 'contact.title', content.contact.title)}
          {field('Body', 'contact.body', content.contact.body, true)}
          {field('Email', 'contact.email', content.contact.email)}
          {field('Phone', 'contact.phone', content.contact.phone)}
          {field('Booking link', 'contact.bookingUrl', content.contact.bookingUrl)}
        </div>
      </details>

      <details className="ak-editor-section">
        <summary>Footer & disclaimer</summary>
        <div className="ak-editor-grid">
          {field('Tagline', 'footer.tagline', content.footer.tagline)}
          {field('Disclaimer / note', 'footer.note', content.footer.note, true)}
        </div>
      </details>

      <style jsx>{`
        .ak-site-editor{max-width:1180px;margin:0 auto;padding-bottom:64px}.ak-editor-topbar{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding:28px;border:1px solid #e6e2da;background:#fff}.ak-editor-kicker{margin:0 0 8px;color:#92743d;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.ak-editor-topbar h1{margin:0;color:#17221c;font-family:Georgia,serif;font-size:clamp(34px,5vw,56px);font-weight:500}.ak-editor-topbar p{max-width:720px;color:#5e665f}.ak-editor-actions{display:flex;gap:10px;flex-wrap:wrap}.ak-editor-primary,.ak-editor-secondary,.ak-upload-button{border:0;padding:12px 16px;font:inherit;font-weight:800;text-decoration:none;cursor:pointer}.ak-editor-primary{background:#17221c;color:#fff}.ak-editor-secondary{background:#f0ede7;color:#17221c}.ak-editor-primary:disabled{opacity:.55;cursor:wait}.ak-editor-status{margin:12px 0 20px;padding:12px 14px;background:#f7f4ee;color:#4c554e;font-size:14px}.ak-editor-section{margin:12px 0;border:1px solid #e6e2da;background:#fff}.ak-editor-section summary{cursor:pointer;padding:18px 20px;color:#17221c;font-weight:850}.ak-editor-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;padding:0 20px 22px}.ak-editor-field{display:grid;gap:7px;color:#3f4942;font-size:13px;font-weight:800}.ak-editor-field textarea,.ak-editor-field input{width:100%;box-sizing:border-box;border:1px solid #d9d5cc;background:#fff;padding:11px 12px;color:#17221c;font:inherit;font-weight:500}.ak-editor-field textarea{resize:vertical}.ak-media-row{display:flex;gap:8px}.ak-media-row>input{flex:1}.ak-upload-button{position:relative;overflow:hidden;background:#e8e1d3;color:#17221c;white-space:nowrap}.ak-upload-button input{position:absolute;inset:0;opacity:0;cursor:pointer}@media(max-width:800px){.ak-editor-topbar{display:grid}.ak-editor-grid{grid-template-columns:1fr}.ak-media-row{display:grid}.ak-editor-actions{width:100%}.ak-editor-primary,.ak-editor-secondary{flex:1;text-align:center}}
      `}</style>
    </section>
  );
}
