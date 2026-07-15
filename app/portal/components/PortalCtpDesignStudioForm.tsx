'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GOLD, NAVY } from '@/lib/design-system';
import type { CtpDesignStudioItem } from '@/lib/ctp-portal-status';
import type { CtpAssetManifestEntry } from '@/lib/ctp-asset-store';

type Props = {
  slug: string;
  designStudio: CtpDesignStudioItem[];
  studioStatus?: string;
  initial?: {
    brand_colors?: string;
    brand_fonts?: string;
    brand_voice?: string;
    competitors?: string;
    inspiration?: string;
    offer_summary?: string;
  };
};

const FIELD_META: Array<{
  id: keyof NonNullable<Props['initial']>;
  label: string;
  placeholder: string;
  rows?: number;
}> = [
  { id: 'brand_colors', label: 'Brand colors', placeholder: 'e.g. Navy #1B2B4D, Gold #D8AD3D' },
  { id: 'brand_fonts', label: 'Fonts', placeholder: 'e.g. Playfair for headlines, Inter for body' },
  { id: 'brand_voice', label: 'Brand voice', placeholder: 'How should you sound?', rows: 3 },
  { id: 'offer_summary', label: 'Products / services', placeholder: 'What do you sell or deliver?', rows: 3 },
  { id: 'competitors', label: 'Competitors', placeholder: 'Who do prospects compare you to?' },
  { id: 'inspiration', label: 'Inspiration URLs', placeholder: 'Sites or brands you love' },
];

const UPLOAD_TYPES = [
  { id: 'logo', label: 'Logo', accept: 'image/*' },
  { id: 'photos', label: 'Photography', accept: 'image/*' },
  { id: 'documents', label: 'Documents', accept: '.pdf,.doc,.docx,.txt,application/pdf' },
  { id: 'brand-guidelines', label: 'Brand guidelines', accept: '.pdf,image/*,.doc,.docx' },
] as const;

function draftTokenFor(slug: string): string {
  if (typeof window === 'undefined') return `portal-${slug}`;
  const key = `ctp-studio-draft:${slug}`;
  const existing = window.localStorage.getItem(key);
  if (existing && existing.length >= 8) return existing;
  const next = `portal-${slug}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(key, next);
  return next;
}

export default function PortalCtpDesignStudioForm({
  slug,
  designStudio,
  studioStatus,
  initial,
}: Props) {
  const router = useRouter();
  const [fields, setFields] = useState({
    brand_colors: initial?.brand_colors ?? '',
    brand_fonts: initial?.brand_fonts ?? '',
    brand_voice: initial?.brand_voice ?? '',
    competitors: initial?.competitors ?? '',
    inspiration: initial?.inspiration ?? '',
    offer_summary: initial?.offer_summary ?? '',
  });
  const [assets, setAssets] = useState<Record<string, CtpAssetManifestEntry>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const alreadyComplete =
    studioStatus === 'Ready For Review' || studioStatus === 'Completed';

  const readyCount = useMemo(
    () => designStudio.filter((item) => item.status === 'ready').length,
    [designStudio],
  );

  async function uploadAsset(assetType: string, file: File) {
    setUploading(assetType);
    setError('');
    setSuccess('');
    try {
      const form = new FormData();
      form.set('draftToken', draftTokenFor(slug));
      form.set('assetType', assetType);
      form.set('file', file);
      const res = await fetch('/api/ctp/assets', { method: 'POST', body: form });
      const data = (await res.json()) as { ok?: boolean; error?: string; asset?: CtpAssetManifestEntry };
      if (!res.ok || !data.ok || !data.asset) {
        setError(data.error || 'Upload failed.');
        return;
      }
      setAssets((current) => ({ ...current, [assetType]: data.asset! }));
    } catch {
      setError('Upload network error.');
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const payloadFields: Record<string, string> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value.trim()) payloadFields[key] = value.trim();
      }
      const res = await fetch('/api/portal/ctp/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: payloadFields,
          assets,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || 'Could not save Design Studio.');
        return;
      }
      setSuccess('Saved. AI production will refresh with your inputs.');
      setAssets({});
      router.refresh();
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function markComplete() {
    setCompleting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/portal/ctp/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || 'Could not mark Design Studio complete.');
        return;
      }
      setSuccess('Marked complete. Our team has been notified — you can still add more later.');
      router.refresh();
    } catch {
      setError('Network error. Try again.');
    } finally {
      setCompleting(false);
    }
  }

  return (
    <section className="ep-module-card" style={{ marginTop: '1.5rem' }}>
      <p
        style={{
          margin: '0 0 0.35rem',
          fontSize: '0.7rem',
          fontWeight: 800,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(216,173,61,0.85)',
        }}
      >
        Design Studio
      </p>
      <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
        Brand & project inputs
      </h2>
      <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
        {readyCount}/{designStudio.length} checklist signals ready. Add what you have — we will refresh
        production from your inputs.
      </p>

      <div
        style={{
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          marginBottom: '1.25rem',
        }}
      >
        {designStudio.map((item) => (
          <div
            key={item.id}
            style={{
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '0.75rem',
              padding: '0.9rem 1rem',
              background:
                item.status === 'ready' ? 'rgba(216,173,61,0.08)' : 'rgba(255,255,255,0.03)',
            }}
          >
            <p
              style={{
                margin: '0 0 0.35rem',
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: item.status === 'ready' ? GOLD : 'rgba(255,255,255,0.45)',
              }}
            >
              {item.status === 'ready' ? 'Ready' : 'Needed'}
            </p>
            <p style={{ margin: '0 0 0.35rem', fontWeight: 700, color: '#fff' }}>{item.label}</p>
            <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.65)' }}>
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '0.85rem' }}>
        {FIELD_META.map((field) => (
          <label key={field.id} style={{ display: 'grid', gap: '0.35rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(216,173,61,0.85)',
              }}
            >
              {field.label}
            </span>
            {field.rows ? (
              <textarea
                value={fields[field.id]}
                onChange={(event) =>
                  setFields((current) => ({ ...current, [field.id]: event.target.value }))
                }
                rows={field.rows}
                placeholder={field.placeholder}
                style={{
                  width: '100%',
                  borderRadius: '0.65rem',
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(0,0,0,0.25)',
                  color: '#fff',
                  padding: '0.75rem 0.85rem',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  resize: 'vertical',
                }}
              />
            ) : (
              <input
                value={fields[field.id]}
                onChange={(event) =>
                  setFields((current) => ({ ...current, [field.id]: event.target.value }))
                }
                placeholder={field.placeholder}
                style={{
                  width: '100%',
                  borderRadius: '0.65rem',
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(0,0,0,0.25)',
                  color: '#fff',
                  padding: '0.75rem 0.85rem',
                  fontSize: '0.9rem',
                }}
              />
            )}
          </label>
        ))}
      </div>

      <div style={{ marginTop: '1.25rem', display: 'grid', gap: '0.75rem' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(216,173,61,0.85)',
          }}
        >
          Uploads
        </p>
        <div
          style={{
            display: 'grid',
            gap: '0.75rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
          {UPLOAD_TYPES.map((item) => (
            <label
              key={item.id}
              style={{
                border: '1px dashed rgba(255,255,255,0.22)',
                borderRadius: '0.75rem',
                padding: '0.85rem',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <span style={{ display: 'block', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
                {item.label}
              </span>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' }}>
                {uploading === item.id
                  ? 'Uploading…'
                  : assets[item.id]
                    ? assets[item.id]!.fileName
                    : 'Choose file'}
              </span>
              <input
                type="file"
                accept={item.accept}
                style={{ display: 'none' }}
                disabled={Boolean(uploading) || busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadAsset(item.id, file);
                  event.target.value = '';
                }}
              />
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <button
          type="button"
          disabled={busy || completing || Boolean(uploading)}
          onClick={() => void save()}
          style={{
            border: 'none',
            borderRadius: '9999px',
            padding: '0.75rem 1.35rem',
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            backgroundColor: GOLD,
            color: NAVY,
            opacity: busy || completing || uploading ? 0.6 : 1,
            cursor: busy || completing || uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Saving…' : 'Save Design Studio'}
        </button>
        <button
          type="button"
          disabled={busy || completing || Boolean(uploading) || alreadyComplete}
          onClick={() => void markComplete()}
          style={{
            border: '1px solid rgba(255,255,255,0.35)',
            borderRadius: '9999px',
            padding: '0.75rem 1.35rem',
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            background: 'transparent',
            color: '#fff',
            opacity: busy || completing || uploading || alreadyComplete ? 0.55 : 1,
            cursor:
              busy || completing || uploading || alreadyComplete ? 'not-allowed' : 'pointer',
          }}
        >
          {alreadyComplete
            ? 'Ready for review'
            : completing
              ? 'Notifying…'
              : 'Mark complete'}
        </button>
        {error ? <p style={{ margin: 0, color: '#f5a8a8', fontSize: '0.85rem' }}>{error}</p> : null}
        {success ? <p style={{ margin: 0, color: '#b7e4c7', fontSize: '0.85rem' }}>{success}</p> : null}
      </div>
      <p style={{ margin: '0.85rem 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
        Save anytime. Mark complete when you want our team notified that you are ready for review.
      </p>
    </section>
  );
}
