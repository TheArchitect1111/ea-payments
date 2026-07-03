'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { BrandProfile } from '@/lib/creative-studio/types';
import '../creative-studio.css';

export default function BrandEditorClient() {
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [headlines, setHeadlines] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void fetch('/api/creative-studio/brand')
      .then((res) => res.json())
      .then((data: { brand?: BrandProfile }) => {
        if (data.brand) {
          setBrand(data.brand);
          setHeadlines((data.brand.preferredHeadlines ?? []).join('\n'));
        }
      })
      .catch(() => setError('Could not load brand profile.'));
  }, []);

  async function save() {
    if (!brand) return;
    setSaving(true);
    setError('');
    setMessage('');

    const res = await fetch('/api/creative-studio/brand', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...brand,
        preferredHeadlines: headlines
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      }),
    });
    const data = (await res.json()) as { ok?: boolean; brand?: BrandProfile; error?: string };
    setSaving(false);

    if (!res.ok || !data.brand) {
      setError(data.error ?? 'Could not save brand profile.');
      return;
    }
    setBrand(data.brand);
    setMessage('Brand profile saved. New campaigns will use these settings.');
  }

  if (!brand) {
    return (
      <main className="cs-page cs-loading">
        <p className="cs-loading-title">{error || 'Loading brand profile…'}</p>
      </main>
    );
  }

  return (
    <main className="cs-page">
      <header className="cs-hero">
        <nav className="cs-subnav">
          <Link href="/admin/creative-studio">Campaigns</Link>
          <span className="cs-subnav-active">Brand</span>
        </nav>
        <p className="cs-kicker">EA Creative Studio™</p>
        <h1 className="cs-title">Brand Profile</h1>
        <p className="cs-lede">
          Colors, voice, and headlines applied automatically when EA generates your communication package.
        </p>
      </header>

      <section className="cs-section cs-panel cs-brand-form">
        <label className="cs-field">
          <span>Organization name</span>
          <input value={brand.organizationName} onChange={(e) => setBrand({ ...brand, organizationName: e.target.value })} />
        </label>

        <div className="cs-field-row">
          <label className="cs-field">
            <span>Primary color</span>
            <input type="color" value={brand.primaryColor} onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })} />
          </label>
          <label className="cs-field">
            <span>Secondary color</span>
            <input type="color" value={brand.secondaryColor} onChange={(e) => setBrand({ ...brand, secondaryColor: e.target.value })} />
          </label>
        </div>

        <label className="cs-field">
          <span>Typography</span>
          <input value={brand.typography ?? ''} onChange={(e) => setBrand({ ...brand, typography: e.target.value })} />
        </label>

        <label className="cs-field">
          <span>Photography style</span>
          <input value={brand.photographyStyle ?? ''} onChange={(e) => setBrand({ ...brand, photographyStyle: e.target.value })} />
        </label>

        <label className="cs-field">
          <span>Voice & tone</span>
          <textarea rows={3} value={brand.voice} onChange={(e) => setBrand({ ...brand, voice: e.target.value })} />
        </label>

        <label className="cs-field">
          <span>Mission statement</span>
          <textarea rows={2} value={brand.missionStatement ?? ''} onChange={(e) => setBrand({ ...brand, missionStatement: e.target.value })} />
        </label>

        <label className="cs-field">
          <span>Audience</span>
          <input value={brand.audience ?? ''} onChange={(e) => setBrand({ ...brand, audience: e.target.value })} />
        </label>

        <label className="cs-field">
          <span>Preferred headlines (one per line)</span>
          <textarea rows={4} value={headlines} onChange={(e) => setHeadlines(e.target.value)} />
        </label>

        <label className="cs-field">
          <span>Default call to action</span>
          <input value={brand.preferredCta} onChange={(e) => setBrand({ ...brand, preferredCta: e.target.value })} />
        </label>

        {error ? (
          <p className="cs-error" role="alert">
            {error}
          </p>
        ) : null}
        {message ? <p className="cs-success">{message}</p> : null}

        <button type="button" className="cs-primary" disabled={saving} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save brand profile'}
        </button>
      </section>

      <section className="cs-section cs-brand-swatch">
        <h2 className="cs-question">Live preview</h2>
        <div className="cs-brand-preview-card" style={{ background: brand.primaryColor, color: '#fff' }}>
          <span style={{ color: brand.secondaryColor }}>{brand.organizationName}</span>
          <h3>{brand.preferredHeadlines?.[0] ?? 'Every mission deserves to be heard.'}</h3>
          <p>{brand.missionStatement}</p>
          <span className="cs-preview-cta" style={{ background: brand.secondaryColor, color: brand.primaryColor }}>
            {brand.preferredCta}
          </span>
        </div>
      </section>
    </main>
  );
}
