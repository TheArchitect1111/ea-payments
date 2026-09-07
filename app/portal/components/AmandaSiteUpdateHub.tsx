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

type EvaPlan = {
  lane: 'routine' | 'preview' | 'protected';
  title: string;
  message: string;
  path?: string;
  before?: string;
  after?: string;
  section?: string;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stringFields(value: unknown, prefix = ''): Array<{ path: string; value: string }> {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'string') return [{ path, value: child }];
    if (child && typeof child === 'object') return stringFields(child, path);
    return [];
  });
}

function sectionFromRequest(request: string) {
  const text = request.toLowerCase();
  const matches: Array<[string[], string]> = [
    [['hero', 'headline', 'opening'], 'Hero'],
    [['introduction', 'intro'], 'Introduction'],
    [['about', 'bio', 'biography', 'meet amanda'], 'Meet Amanda'],
    [['pathway', 'pathways'], 'Pathways'],
    [['restore'], 'Restore'],
    [['learn', 'class', 'course'], 'Learn'],
    [['create'], 'Create'],
    [['impact', 'speaking', 'media'], 'Impact, speaking & media'],
    [['contact', 'email', 'phone', 'booking'], 'Contact & booking'],
    [['footer', 'disclaimer', 'tagline'], 'Footer & disclaimer'],
  ];
  return matches.find(([terms]) => terms.some((term) => text.includes(term)))?.[1];
}

function makeEvaPlan(request: string, content: AmandaSiteContent): EvaPlan {
  const text = request.trim();
  const lower = text.toLowerCase();
  const protectedTerms = ['payment', 'checkout', 'domain', 'dns', 'navigation', 'security', 'login', 'password', 'code', 'integration', 'delete page'];
  if (protectedTerms.some((term) => lower.includes(term))) {
    return {
      lane: 'protected',
      title: 'EA review required',
      message: 'That request touches protected website infrastructure. Eva will not change it directly. Your current site stays unchanged.',
    };
  }

  const fields = stringFields(content);
  const fromTo = text.match(/\bfrom\s+[“"]?(.+?)[”"]?\s+to\s+[“"]?(.+?)[”"]?[.!]?$/i);
  if (fromTo) {
    const before = fromTo[1].trim().replace(/[.!]$/, '');
    const replacement = fromTo[2].trim().replace(/[.!]$/, '');
    const matches = fields.filter((field) => field.value.toLowerCase().includes(before.toLowerCase()));
    if (matches.length === 1) {
      const match = matches[0];
      const index = match.value.toLowerCase().indexOf(before.toLowerCase());
      const after = `${match.value.slice(0, index)}${replacement}${match.value.slice(index + before.length)}`;
      return {
        lane: 'preview',
        title: 'Eva found the exact change',
        message: 'Review the before and after below. Approving prepares the change as a draft. It will not go live until you publish.',
        path: match.path,
        before: match.value,
        after,
        section: sectionFromRequest(text),
      };
    }
  }

  const replaceWith = text.match(/\breplace\s+[“"]?(.+?)[”"]?\s+with\s+[“"]?(.+?)[”"]?[.!]?$/i);
  if (replaceWith) {
    const before = replaceWith[1].trim().replace(/[.!]$/, '');
    const replacement = replaceWith[2].trim().replace(/[.!]$/, '');
    const matches = fields.filter((field) => field.value.toLowerCase().includes(before.toLowerCase()));
    if (matches.length === 1) {
      const match = matches[0];
      const index = match.value.toLowerCase().indexOf(before.toLowerCase());
      const after = `${match.value.slice(0, index)}${replacement}${match.value.slice(index + before.length)}`;
      return {
        lane: 'preview',
        title: 'Eva found the exact change',
        message: 'Review the before and after below. Approving prepares the change as a draft. It will not go live until you publish.',
        path: match.path,
        before: match.value,
        after,
        section: sectionFromRequest(text),
      };
    }
  }

  const section = sectionFromRequest(text);
  return {
    lane: 'routine',
    title: section ? `Eva identified ${section}` : 'Eva will guide this update',
    message: section
      ? `I found the part of your website this request belongs to. Open the fine-tune controls only if you want to edit the exact field yourself.`
      : 'I understand this as a normal content request, but I need an exact before-and-after value to prepare it automatically. Your site remains unchanged.',
    section,
  };
}

export default function AmandaSiteUpdateHub({ slug, initialContent }: Props) {
  const [content, setContent] = useState<AmandaSiteContent>(() => clone(initialContent));
  const [status, setStatus] = useState('Your live website is unchanged until you publish.');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<MediaTarget | null>(null);
  const [evaRequest, setEvaRequest] = useState('');
  const [evaPlan, setEvaPlan] = useState<EvaPlan | null>(null);
  const [showControls, setShowControls] = useState(false);
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
    setStatus('Draft updated. Your live website is still unchanged.');
  }

  function askEva(event: React.FormEvent) {
    event.preventDefault();
    if (!evaRequest.trim()) return;
    setEvaPlan(makeEvaPlan(evaRequest, content));
  }

  function approveEvaDraft() {
    if (!evaPlan?.path || typeof evaPlan.after !== 'string') return;
    update(evaPlan.path, evaPlan.after);
    setStatus('Eva prepared the change as a draft. Preview it, then publish when ready.');
    setEvaPlan({ ...evaPlan, title: 'Draft prepared', message: 'The requested change is now in your draft. Your live website has not changed yet.' });
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
      setStatus('Media uploaded to your draft. Publish to make it live.');
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
          <input type="file" accept={accept} disabled={Boolean(uploading)} onChange={(event) => void upload(target, event.target.files?.[0])} />
        </label>
      </div>
    </div>
  );

  return (
    <section className="ak-site-editor" aria-label="Amanda Catherine website update hub">
      <div className="ak-editor-topbar">
        <div>
          <p className="ak-editor-kicker">Update Hub™ · AmandaCatherine.ca</p>
          <h1>Tell Eva what you want changed.</h1>
          <p>Use normal language. Eva prepares safe content changes as drafts, then you preview and publish.</p>
        </div>
        <div className="ak-editor-actions">
          <a href={previewUrl} target="_blank" rel="noreferrer" className="ak-editor-secondary">Preview site</a>
          <button type="button" onClick={() => void publish()} disabled={busy} className="ak-editor-primary">
            {busy ? 'Publishing…' : 'Publish approved changes'}
          </button>
        </div>
      </div>

      <div className="ak-editor-status" role="status">● {status}</div>

      <div className="eva-card">
        <div className="eva-heading">
          <div className="eva-orb">✦</div>
          <div><h2>Eva</h2><p>Your website update assistant</p></div>
        </div>
        <form onSubmit={askEva}>
          <textarea
            value={evaRequest}
            onChange={(event) => { setEvaRequest(event.target.value); setEvaPlan(null); }}
            rows={5}
            aria-label="Tell Eva what you want to update"
            placeholder="Example: Change the headline from “Old headline” to “New headline”."
          />
          <div className="eva-form-footer">
            <span>Content changes stay in draft. Payments, domains, security and code stay protected.</span>
            <button type="submit" className="ak-editor-primary">Send to Eva →</button>
          </div>
        </form>
        <div className="eva-examples">
          {[
            'Change the headline from “Old headline” to “New headline”.',
            'I want to update my biography.',
            'I need to change my booking information.',
          ].map((example) => (
            <button type="button" key={example} onClick={() => { setEvaRequest(example); setEvaPlan(null); }}>{example}</button>
          ))}
        </div>
      </div>

      {evaPlan && (
        <div className={`eva-plan eva-${evaPlan.lane}`} aria-live="polite">
          <div>
            <span className="eva-plan-label">{evaPlan.lane === 'protected' ? 'Protected' : evaPlan.lane === 'preview' ? 'Preview' : 'Routine'}</span>
            <h2>{evaPlan.title}</h2>
            <p>{evaPlan.message}</p>
            {evaPlan.section && <p className="eva-target">Website area: <strong>{evaPlan.section}</strong></p>}
          </div>
          {evaPlan.before !== undefined && evaPlan.after !== undefined && (
            <div className="eva-diff">
              <div><span>Before</span><p>{evaPlan.before}</p></div>
              <div><span>After</span><p>{evaPlan.after}</p></div>
              <button type="button" className="ak-editor-primary" onClick={approveEvaDraft}>Approve draft change</button>
            </div>
          )}
        </div>
      )}

      <div className="ak-simple-actions">
        <button type="button" className="ak-editor-secondary" onClick={() => setShowControls((value) => !value)}>
          {showControls ? 'Hide fine-tune controls' : 'Fine-tune manually'}
        </button>
        <span>Most clients should never need this section.</span>
      </div>

      {showControls && (
        <div className="ak-manual-controls">
          <details open className="ak-editor-section"><summary>Hero</summary><div className="ak-editor-grid">
            {field('Eyebrow', 'hero.eyebrow', content.hero.eyebrow)}
            {field('Headline', 'hero.title', content.hero.title)}
            {field('Intro copy', 'hero.subtitle', content.hero.subtitle, true)}
            {field('Primary button label', 'hero.primaryLabel', content.hero.primaryLabel)}
            {field('Primary button link', 'hero.primaryHref', content.hero.primaryHref)}
            {field('Secondary button label', 'hero.secondaryLabel', content.hero.secondaryLabel)}
            {field('Secondary button link', 'hero.secondaryHref', content.hero.secondaryHref)}
            {media('Hero image', 'hero.imageUrl', content.hero.imageUrl, 'image/*')}
            {media('Hero video', 'hero.videoUrl', content.hero.videoUrl, 'video/*')}
          </div></details>

          <details className="ak-editor-section"><summary>Introduction</summary><div className="ak-editor-grid">
            {field('Eyebrow', 'intro.eyebrow', content.intro.eyebrow)}
            {field('Headline', 'intro.title', content.intro.title)}
            {field('Body', 'intro.body', content.intro.body, true)}
          </div></details>

          <details className="ak-editor-section"><summary>Meet Amanda</summary><div className="ak-editor-grid">
            {field('Headline', 'about.title', content.about.title)}
            {field('Biography', 'about.body', content.about.body, true)}
            {field('Additional biography', 'about.secondaryBody', content.about.secondaryBody, true)}
            {media('About image', 'about.imageUrl', content.about.imageUrl, 'image/*')}
          </div></details>

          <details className="ak-editor-section"><summary>Pathways</summary><div className="ak-editor-grid">
            {field('Headline', 'pathways.title', content.pathways.title)}
            {field('Intro', 'pathways.body', content.pathways.body, true)}
            {field('Restore pathway', 'pathways.restoreBody', content.pathways.restoreBody, true)}
            {field('Learn pathway', 'pathways.learnBody', content.pathways.learnBody, true)}
            {field('Create pathway', 'pathways.createBody', content.pathways.createBody, true)}
          </div></details>

          <details className="ak-editor-section"><summary>Restore</summary><div className="ak-editor-grid">
            {field('Headline', 'restore.title', content.restore.title)}
            {field('Body', 'restore.body', content.restore.body, true)}
            {media('Restore image', 'restore.imageUrl', content.restore.imageUrl, 'image/*')}
          </div></details>

          <details className="ak-editor-section"><summary>Learn</summary><div className="ak-editor-grid">
            {field('Headline', 'learn.title', content.learn.title)}
            {field('Body', 'learn.body', content.learn.body, true)}
            {media('Learn image', 'learn.imageUrl', content.learn.imageUrl, 'image/*')}
          </div></details>

          <details className="ak-editor-section"><summary>Create</summary><div className="ak-editor-grid">
            {field('Headline', 'create.title', content.create.title)}
            {field('Body', 'create.body', content.create.body, true)}
            {media('Create image', 'create.imageUrl', content.create.imageUrl, 'image/*')}
          </div></details>

          <details className="ak-editor-section"><summary>Impact, speaking & media</summary><div className="ak-editor-grid">
            {field('Headline', 'impact.title', content.impact.title)}
            {field('Body', 'impact.body', content.impact.body, true)}
            {media('Impact image', 'impact.imageUrl', content.impact.imageUrl, 'image/*')}
          </div></details>

          <details className="ak-editor-section"><summary>Contact & booking</summary><div className="ak-editor-grid">
            {field('Headline', 'contact.title', content.contact.title)}
            {field('Body', 'contact.body', content.contact.body, true)}
            {field('Email', 'contact.email', content.contact.email)}
            {field('Phone', 'contact.phone', content.contact.phone)}
            {field('Booking link', 'contact.bookingUrl', content.contact.bookingUrl)}
          </div></details>

          <details className="ak-editor-section"><summary>Footer & disclaimer</summary><div className="ak-editor-grid">
            {field('Tagline', 'footer.tagline', content.footer.tagline)}
            {field('Disclaimer / note', 'footer.note', content.footer.note, true)}
          </div></details>
        </div>
      )}

      <style jsx>{`
        .ak-site-editor{max-width:1180px;margin:0 auto;padding-bottom:64px}.ak-editor-topbar{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding:28px;border:1px solid #e6e2da;background:#fff}.ak-editor-kicker{margin:0 0 8px;color:#92743d;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.ak-editor-topbar h1{margin:0;color:#17221c;font-family:Georgia,serif;font-size:clamp(34px,5vw,56px);font-weight:500}.ak-editor-topbar p{max-width:720px;color:#5e665f}.ak-editor-actions{display:flex;gap:10px;flex-wrap:wrap}.ak-editor-primary,.ak-editor-secondary,.ak-upload-button{border:0;padding:12px 16px;font:inherit;font-weight:800;text-decoration:none;cursor:pointer}.ak-editor-primary{background:#17221c;color:#fff}.ak-editor-secondary{background:#f0ede7;color:#17221c}.ak-editor-primary:disabled{opacity:.55;cursor:wait}.ak-editor-status{margin:12px 0 20px;padding:12px 14px;background:#eef7f1;color:#31533f;font-size:14px}.eva-card{padding:28px;border:1px solid #dfe4ee;background:#fff;box-shadow:0 16px 50px rgba(23,34,28,.07)}.eva-heading{display:flex;align-items:center;gap:14px;margin-bottom:18px}.eva-orb{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;background:#17221c;color:#d5b565;font-size:24px}.eva-heading h2{margin:0;font-family:Georgia,serif;font-size:28px;color:#17221c}.eva-heading p{margin:2px 0 0;color:#6d746f}.eva-card textarea{width:100%;box-sizing:border-box;border:1px solid #d9d5cc;background:#fbfbfa;padding:16px;color:#17221c;font:inherit;resize:vertical;min-height:135px}.eva-card textarea:focus{outline:2px solid rgba(146,116,61,.25);border-color:#92743d}.eva-form-footer{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:12px;flex-wrap:wrap}.eva-form-footer span{font-size:13px;color:#777e79}.eva-examples{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.eva-examples button{border:1px solid #e1ddd4;background:#f8f6f1;color:#59615b;padding:8px 11px;border-radius:999px;cursor:pointer;font-size:12px}.eva-plan{margin:16px 0;padding:22px;border-left:4px solid;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px}.eva-plan-label{font-size:11px;font-weight:900;letter-spacing:.11em;text-transform:uppercase}.eva-plan h2{margin:6px 0 8px;font-family:Georgia,serif;color:#17221c}.eva-plan p{margin:0;color:#4f5952;line-height:1.55}.eva-target{margin-top:9px!important}.eva-routine{background:#eef7f1;border-color:#47795b}.eva-routine .eva-plan-label{color:#47795b}.eva-preview{background:#fff8e7;border-color:#92743d}.eva-preview .eva-plan-label{color:#92743d}.eva-protected{background:#fff1f2;border-color:#a33c4d}.eva-protected .eva-plan-label{color:#a33c4d}.eva-diff{display:grid;gap:10px}.eva-diff>div{background:rgba(255,255,255,.75);padding:12px}.eva-diff span{font-size:11px;text-transform:uppercase;letter-spacing:.1em;font-weight:900;color:#777}.eva-diff p{margin-top:5px}.ak-simple-actions{display:flex;align-items:center;gap:12px;margin:20px 0;color:#777e79;font-size:13px}.ak-manual-controls{padding-top:2px}.ak-editor-section{margin:12px 0;border:1px solid #e6e2da;background:#fff}.ak-editor-section summary{cursor:pointer;padding:18px 20px;color:#17221c;font-weight:850}.ak-editor-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;padding:0 20px 22px}.ak-editor-field{display:grid;gap:7px;color:#3f4942;font-size:13px;font-weight:800}.ak-editor-field textarea,.ak-editor-field input{width:100%;box-sizing:border-box;border:1px solid #d9d5cc;background:#fff;padding:11px 12px;color:#17221c;font:inherit;font-weight:500}.ak-editor-field textarea{resize:vertical}.ak-media-row{display:flex;gap:8px}.ak-media-row>input{flex:1}.ak-upload-button{position:relative;overflow:hidden;background:#e8e1d3;color:#17221c;white-space:nowrap}.ak-upload-button input{position:absolute;inset:0;opacity:0;cursor:pointer}@media(max-width:800px){.ak-editor-topbar{display:grid}.ak-editor-grid,.eva-plan{grid-template-columns:1fr}.ak-media-row{display:grid}.ak-editor-actions{width:100%}.ak-editor-primary,.ak-editor-secondary{flex:1;text-align:center}.eva-form-footer{align-items:stretch}.eva-form-footer .ak-editor-primary{width:100%}.eva-examples{display:grid}.eva-examples button{text-align:left;border-radius:8px}.ak-simple-actions{align-items:flex-start;flex-direction:column}}
      `}</style>
    </section>
  );
}
