'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { AMANDA_PORTAL_FORMS } from '@/lib/amanda-catherine/config';
import type { CtpAssetManifestEntry } from '@/lib/ctp-asset-store';

type Props = {
  slug: string;
  kind: 'intake' | 'application';
  title: string;
  submitLabel: string;
};

export default function PortalFormClient({ slug, kind, title, submitLabel }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [formId, setFormId] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [uploads, setUploads] = useState<Record<string, CtpAssetManifestEntry>>({});
  const [uploading, setUploading] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const isAmanda = slug.toLowerCase().startsWith('amanda-catherine');
  const formOptions = useMemo(
    () => AMANDA_PORTAL_FORMS.filter((form) => form.kind === kind),
    [kind],
  );
  const selectedForm = formOptions.find((form) => form.id === formId);

  async function uploadDocument(assetType: string, file: File) {
    setUploading(assetType);
    setError('');
    try {
      const form = new FormData();
      form.set('draftToken', `${slug}:${email || 'portal-user'}`);
      form.set('assetType', assetType);
      form.set('file', file);
      const res = await fetch('/api/ctp/assets', { method: 'POST', body: form });
      const data = (await res.json()) as { ok?: boolean; error?: string; asset?: CtpAssetManifestEntry };
      if (!res.ok || !data.ok || !data.asset) {
        setError(data.error || 'Upload failed.');
        return;
      }
      setUploads((current) => ({ ...current, [assetType]: data.asset! }));
    } catch {
      setError('Upload network error.');
    } finally {
      setUploading('');
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/portal/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          kind,
          name,
          email,
          phone,
          notes,
          payload: {
            formId: selectedForm?.id,
            audience: selectedForm?.audience,
            answers,
            assetUploads: uploads,
            onboardingStatus: 'confirmation-pending',
          },
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || 'Could not submit — try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Network error — try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="ep-module-card">
        <p className="ep-module-card-title">{title} received</p>
        <p className="ep-module-card-note">
          Thank you — your team will follow up at {email || 'the email you provided'}.
        </p>
      </div>
    );
  }

  return (
    <form className="ep-module-card" onSubmit={onSubmit}>
      <p className="ep-module-card-title">{title}</p>
      {isAmanda ? (
        <label className="ep-form-field">
          <span>Choose the form that fits your next step</span>
          <select
            className="ep-input"
            value={formId}
            onChange={(e) => {
              setFormId(e.target.value);
              setAnswers({});
              setUploads({});
            }}
            required
          >
            <option value="">Select a form</option>
            {formOptions.map((form) => (
              <option key={form.id} value={form.id}>{form.title}</option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="ep-form-field">
        <span>Name</span>
        <input
          className="ep-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </label>
      {selectedForm?.fields.map((field) => (
        <label key={field} className="ep-form-field">
          <span>{field.replaceAll('-', ' ')}</span>
          <textarea
            className="ep-input"
            rows={3}
            value={answers[field] || ''}
            onChange={(e) => setAnswers((current) => ({ ...current, [field]: e.target.value }))}
            required
          />
        </label>
      ))}
      {selectedForm?.uploads.map((assetType) => (
        <label key={assetType} className="ep-form-field">
          <span>{assetType.replaceAll('-', ' ')}</span>
          <input
            className="ep-input"
            type="file"
            accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,video/mp4,video/quicktime"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadDocument(assetType, file);
            }}
            required={!uploads[assetType]}
            disabled={Boolean(uploading)}
          />
          {uploads[assetType] ? <small>{uploads[assetType].fileName} uploaded</small> : null}
        </label>
      ))}
      <label className="ep-form-field">
        <span>Email</span>
        <input
          className="ep-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>
      <label className="ep-form-field">
        <span>Phone (optional)</span>
        <input
          className="ep-input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
      </label>
      <label className="ep-form-field">
        <span>{kind === 'application' ? 'Why you are applying' : 'Goals or notes'}</span>
        <textarea
          className="ep-input"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      {error ? <p className="ep-module-card-note" style={{ color: '#b42318' }}>{error}</p> : null}
      <p style={{ marginTop: 16 }}>
        <button type="submit" className="ep-btn" disabled={busy || Boolean(uploading)}>
          {uploading ? 'Uploading…' : busy ? 'Sending…' : submitLabel}
        </button>
      </p>
    </form>
  );
}
