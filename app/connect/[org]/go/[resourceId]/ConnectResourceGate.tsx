'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { ConnectOrgConfig, ConnectResource } from '@/lib/connect-store';

type Props = {
  org: ConnectOrgConfig;
  resource: ConnectResource;
  event?: string;
  representative?: string;
  source?: string;
  campaignId?: string;
};

export default function ConnectResourceGate({
  org,
  resource,
  event,
  representative,
  source = 'QR',
  campaignId,
}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetch('/api/connect/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgSlug: org.slug,
        type: 'scan',
        campaignId,
        resourceId: resource.id,
      }),
    });
  }, [org.slug, campaignId, resource.id]);

  async function unlockResource(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.includes('@')) {
      setError('Enter your name and a valid email to receive this resource.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/connect/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgSlug: org.slug,
          name: name.trim(),
          email: email.trim(),
          source,
          event,
          representative,
          campaignId,
          leadType: org.leadTypes[0],
          conversationNotes: `Resource-first scan: ${resource.title}`,
          tags: [resource.type, resource.id, event].filter(Boolean),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Unable to activate relationship.');

      const trackUrl = `/api/connect/track?org=${encodeURIComponent(org.slug)}&relationship=${encodeURIComponent(data.relationship.id)}&campaign=${encodeURIComponent(campaignId ?? '')}&resource=${encodeURIComponent(resource.id)}&type=resource_download&to=${encodeURIComponent(resource.url.startsWith('http') ? resource.url : `${window.location.origin}${resource.url}`)}`;
      window.location.href = trackUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSaving(false);
    }
  }

  const style = {
    '--connect-ink': org.colors.ink,
    '--connect-accent': org.colors.accent,
    '--connect-soft': org.colors.soft,
  } as CSSProperties;

  return (
    <main className="connect-site" style={style}>
      <section className="connect-shell connect-offer-shell">
        <header className="connect-hero">
          <p className="connect-kicker">{org.qrCodeLabel}</p>
          <h1>{resource.title}</h1>
          <p>{resource.description}</p>
          <div className="connect-offer-card" aria-label="Branded resource">
            <span>{resource.type}</span>
            <strong>{org.name}</strong>
            <small>{org.offer.promise}</small>
          </div>
        </header>

        <form className="connect-form connect-offer-form" onSubmit={unlockResource}>
          <p className="connect-offer-lead">
            Enter your email and we&apos;ll send this {resource.type.toLowerCase()} plus your follow-up sequence from {org.name}.
          </p>
          {error ? <p className="connect-error">{error}</p> : null}
          <label>
            Your name
            <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <button type="submit" className="connect-primary" disabled={saving}>
            {saving ? 'Sending…' : `Get ${resource.title}`}
          </button>
        </form>
      </section>
    </main>
  );
}
