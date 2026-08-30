'use client';

import { useMemo, useState } from 'react';
import type { AmandaSiteContent } from '@/lib/amanda-catherine/site-content';

type Props = { slug: string; initialContent: AmandaSiteContent };
type MediaTarget = 'hero.imageUrl' | 'hero.videoUrl' | 'restore.imageUrl' | 'learn.imageUrl' | 'create.imageUrl';

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

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
      for (let i = 0; i < keys.length - 1; i += 1) cursor = cursor[keys[i]] as Record<string, unknown>;
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
      const form = new FormData(); form.append('file', file);
      const response = await fetch(`/api/portal/amanda/site-media?slug=${encodeURIComponent(slug)}`, { method: 'POST', body: form });
      const payload = await response.json();
      if (!response.ok || !payload.ok || !payload.url) { setStatus(payload.error ?? 'Upload failed.'); return; }
      update(target, payload.url);
      setStatus('Media uploaded. Publish to make it live.');
    } catch { setStatus('Upload failed. Please try again.'); }
    finally { setUploading(null); }
  }

  async function publish() {
    setBusy(true); setStatus('Publishing…');
    try {
      const response = await fetch('/api/portal/amanda/site-content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, content }) });
      const payload = await response.json();
      if (!response.ok || !payload.ok) { setStatus(payload.error ?? 'Publish failed.'); return; }
      setContent(payload.content);
      setStatus(payload.persisted ? 'Published and durably saved.' : 'Published. Durable storage is not connected.');
    } catch { setStatus('Publish failed. Please try again.'); }
    finally { setBusy(false); }
  }

  const field = (label: string, path: string, value: string, multiline = false) => (
    <label className="ak-editor-field"><span>{label}</span>{multiline ? <textarea value={value} onChange={(e) => update(path, e.target.value)} rows={4} /> : <input value={value} onChange={(e) => update(path, e.target.value)} />}</label>
  );
  const media = (label: string, target: MediaTarget, value: string, accept: string) => (
    <div className="ak-editor-field"><span>{label}</span><div className="ak-media-row"><input value={value} onChange={(e) => update(target, e.target.value)} placeholder="Paste a media URL or upload a file" /><label className="ak-upload-button">{uploading === target ? 'Uploading…' : 'Upload'}<input type="file" accept={accept} disabled={Boolean(uploading)} onChange={(e) => void upload(target, e.target.files?.[0])} /></label></div></div>
  );
  const section = (title: string, children: React.ReactNode, open = false) => <details open={open} className="ak-editor-section"><summary>{title}</summary><div className="ak-editor-grid">{children}</div></details>;

  return (
    <section className="ak-site-editor" aria-label="Amanda Catherine website update hub">
      <div className="ak-editor-topbar"><div><p className="ak-editor-kicker">Update Hub™ · AmandaCatherine.ca</p><h1>Edit your website</h1><p>Every public section, price, link, photo and video is controlled here.</p></div><div className="ak-editor-actions"><a href={previewUrl} target="_blank" rel="noreferrer" className="ak-editor-secondary">Preview</a><button type="button" onClick={() => void publish()} disabled={busy} className="ak-editor-primary">{busy ? 'Publishing…' : 'Publish changes'}</button></div></div>
      <div className="ak-editor-status" role="status">{status}</div>

      {section('Hero', <>{field('Eyebrow','hero.eyebrow',content.hero.eyebrow)}{field('Headline','hero.title',content.hero.title,true)}{field('Intro copy','hero.subtitle',content.hero.subtitle,true)}{field('Primary button label','hero.primaryLabel',content.hero.primaryLabel)}{field('Primary button link','hero.primaryHref',content.hero.primaryHref)}{field('Secondary button label','hero.secondaryLabel',content.hero.secondaryLabel)}{field('Secondary button link','hero.secondaryHref',content.hero.secondaryHref)}{media('Hero image','hero.imageUrl',content.hero.imageUrl,'image/*')}{media('Hero video','hero.videoUrl',content.hero.videoUrl,'video/*')}</>, true)}
      {section('Introduction', <>{field('Eyebrow','intro.eyebrow',content.intro.eyebrow)}{field('Headline','intro.title',content.intro.title)}{field('Body','intro.body',content.intro.body,true)}</>, true)}
      {section('Restore / clinic', <>{field('Eyebrow','restore.eyebrow',content.restore.eyebrow)}{field('Headline','restore.title',content.restore.title)}{field('Body','restore.body',content.restore.body,true)}{field('Clinic name','restore.clinicName',content.restore.clinicName)}{field('Clinic subtitle','restore.clinicSubtitle',content.restore.clinicSubtitle)}{field('Address','restore.address',content.restore.address)}{field('Phone','restore.phone',content.restore.phone)}{field('Email','restore.email',content.restore.email)}{field('Jane booking link','restore.bookingUrl',content.restore.bookingUrl)}{media('Restore image','restore.imageUrl',content.restore.imageUrl,'image/*')}</>, true)}
      {section('Three pathways', <>{field('Eyebrow','pathways.eyebrow',content.pathways.eyebrow)}{field('Headline','pathways.title',content.pathways.title)}{field('Restore description','pathways.restoreBody',content.pathways.restoreBody,true)}{field('Learn description','pathways.learnBody',content.pathways.learnBody,true)}{field('Create description','pathways.createBody',content.pathways.createBody,true)}</>)}
      {section('Learn / courses & pricing', <>{field('Eyebrow','learn.eyebrow',content.learn.eyebrow)}{field('Headline','learn.title',content.learn.title)}{field('Body','learn.body',content.learn.body,true)}{field('Button label','learn.ctaLabel',content.learn.ctaLabel)}{field('Button link','learn.ctaHref',content.learn.ctaHref)}{media('Learn image','learn.imageUrl',content.learn.imageUrl,'image/*')}{content.learn.programs.map((p,i)=><div className="ak-program" key={`${p.title}-${i}`}><strong>Course {i+1}</strong>{field('Course name',`learn.programs.${i}.title`,p.title)}{field('Price',`learn.programs.${i}.price`,p.price)}{field('Description',`learn.programs.${i}.description`,p.description,true)}</div>)}</>)}
      {section('Create', <>{field('Eyebrow','create.eyebrow',content.create.eyebrow)}{field('Headline','create.title',content.create.title)}{field('Intro','create.body',content.create.body,true)}{media('Create image','create.imageUrl',content.create.imageUrl,'image/*')}{content.create.cards.map((c,i)=><div className="ak-program" key={`${c.title}-${i}`}><strong>Card {i+1}</strong>{field('Title',`create.cards.${i}.title`,c.title)}{field('Body',`create.cards.${i}.body`,c.body,true)}</div>)}</>)}
      {section('Contact & booking', <>{field('Eyebrow','contact.eyebrow',content.contact.eyebrow)}{field('Headline','contact.title',content.contact.title)}{field('Body','contact.body',content.contact.body,true)}{field('Email','contact.email',content.contact.email)}{field('Phone','contact.phone',content.contact.phone)}{field('Address','contact.address',content.contact.address)}{field('Hours','contact.hours',content.contact.hours)}{field('Booking link','contact.bookingUrl',content.contact.bookingUrl)}{field('Enrollment link','contact.enrollUrl',content.contact.enrollUrl)}</>)}
      {section('Footer', <>{field('Tagline','footer.tagline',content.footer.tagline)}{field('Organizations / note','footer.note',content.footer.note,true)}</>)}

      <style jsx>{`
.ak-site-editor{max-width:1180px;margin:0 auto;padding-bottom:64px}.ak-editor-topbar{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding:28px;border:1px solid #e6e2da;background:#fff}.ak-editor-kicker{margin:0 0 8px;color:#92743d;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.ak-editor-topbar h1{margin:0;color:#17221c;font-family:Georgia,serif;font-size:clamp(34px,5vw,56px);font-weight:500}.ak-editor-topbar p{max-width:720px;color:#5e665f}.ak-editor-actions{display:flex;gap:10px;flex-wrap:wrap}.ak-editor-primary,.ak-editor-secondary,.ak-upload-button{border:0;padding:12px 16px;font:inherit;font-weight:800;text-decoration:none;cursor:pointer}.ak-editor-primary{background:#17221c;color:#fff}.ak-editor-secondary{background:#f0ede7;color:#17221c}.ak-editor-status{margin:12px 0 20px;padding:12px 14px;background:#f7f4ee;color:#4c554e;font-size:14px}.ak-editor-section{margin:12px 0;border:1px solid #e6e2da;background:#fff}.ak-editor-section summary{cursor:pointer;padding:18px 20px;color:#17221c;font-weight:850}.ak-editor-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;padding:0 20px 22px}.ak-editor-field{display:grid;gap:7px;color:#3f4942;font-size:13px;font-weight:800}.ak-editor-field textarea,.ak-editor-field input{width:100%;box-sizing:border-box;border:1px solid #d9d5cc;background:#fff;padding:11px 12px;color:#17221c;font:inherit;font-weight:500}.ak-media-row{display:flex;gap:8px}.ak-media-row>input{flex:1}.ak-upload-button{position:relative;overflow:hidden;background:#e8e1d3;color:#17221c;white-space:nowrap}.ak-upload-button input{position:absolute;inset:0;opacity:0;cursor:pointer}.ak-program{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:16px;border:1px solid #eee9df}.ak-program strong{grid-column:1/-1}@media(max-width:800px){.ak-editor-topbar,.ak-editor-grid,.ak-program{display:grid;grid-template-columns:1fr}.ak-media-row{display:grid}.ak-editor-actions{width:100%}.ak-editor-primary,.ak-editor-secondary{flex:1;text-align:center}}
      `}</style>
    </section>
  );
}
