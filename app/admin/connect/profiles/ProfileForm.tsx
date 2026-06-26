'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ConnectProfile } from '@/lib/connect-types';

export default function ProfileForm({ profile }: { profile?: ConnectProfile }) {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function save(formData: FormData) {
    setStatus('Saving...');
    setError('');
    const resourceLabel = String(formData.get('resourceLabel') || '').trim();
    const resourceUrl = String(formData.get('resourceUrl') || '').trim();
    const destinationLabel = String(formData.get('destinationLabel') || '').trim();
    const destinationUrl = String(formData.get('destinationUrl') || '').trim();
    const destinationPriority = String(formData.get('destinationPriority') || '').trim();
    const resources = resourceLabel && resourceUrl ? [{ label: resourceLabel, url: resourceUrl, tags: ['connect'] }] : [];
    const destinations = destinationLabel && destinationUrl
      ? [{ label: destinationLabel, url: destinationUrl, priority: destinationPriority || undefined }]
      : [];

    const payload = {
      id: profile?.id,
      brandName: String(formData.get('brandName') || ''),
      slug: String(formData.get('slug') || '').trim().toLowerCase(),
      logoUrl: String(formData.get('logoUrl') || ''),
      primaryColor: String(formData.get('primaryColor') || '#0A66FF'),
      headline: String(formData.get('headline') || ''),
      subheadline: String(formData.get('subheadline') || ''),
      ctaText: String(formData.get('ctaText') || 'Connect'),
      defaultDestinationUrl: String(formData.get('defaultDestinationUrl') || ''),
      destinations,
      resources,
      welcomeEmailSubject: String(formData.get('welcomeEmailSubject') || ''),
      welcomeEmailBody: String(formData.get('welcomeEmailBody') || ''),
      ownerNotificationEmail: String(formData.get('ownerNotificationEmail') || ''),
      isActive: formData.get('isActive') === 'on',
    };

    const res = await fetch('/api/connect/admin', {
      method: profile ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      setStatus('');
      setError(data.error || 'Could not save profile.');
      return;
    }
    setStatus('Saved.');
    router.push('/admin/connect/profiles');
    router.refresh();
  }

  return (
    <main className="connect-admin">
      <header className="connect-admin-head">
        <div>
          <p>EA Connect Experience</p>
          <h1>{profile ? 'Edit Profile' : 'New Profile'}</h1>
        </div>
        <div className="connect-admin-actions">
          <Link href="/admin/connect/profiles">Profiles</Link>
          {profile ? <Link href={`/connect/${profile.slug}`}>Open Link</Link> : null}
        </div>
      </header>

      <form
        className="connect-profile-form"
        action={(formData) => {
          void save(formData);
        }}
      >
        <label>Brand name<input name="brandName" required defaultValue={profile?.brandName || ''} /></label>
        <label>Slug<input name="slug" required defaultValue={profile?.slug || ''} /></label>
        <label>Logo URL<input name="logoUrl" defaultValue={profile?.logoUrl || ''} /></label>
        <label>Primary color<input name="primaryColor" defaultValue={profile?.primaryColor || '#0A66FF'} /></label>
        <label>Headline<input name="headline" required defaultValue={profile?.headline || ''} /></label>
        <label>Subheadline<textarea name="subheadline" rows={2} defaultValue={profile?.subheadline || ''} /></label>
        <label>CTA text<input name="ctaText" defaultValue={profile?.ctaText || 'Connect'} /></label>
        <section className="connect-form-section">
          <h2>After They Connect</h2>
          <p>Send people to one simple next step. Leave blank to show the thank-you screen.</p>
          <label>Default destination<input name="defaultDestinationUrl" placeholder="https://efficiencyarchitects.online" defaultValue={profile?.defaultDestinationUrl || ''} /></label>
        </section>
        <section className="connect-form-section">
          <h2>Optional Resource</h2>
          <p>Add one helpful link that can be suggested after the connection is classified.</p>
          <div className="connect-form-grid">
            <label>Label<input name="resourceLabel" placeholder="Website" defaultValue={profile?.resources?.[0]?.label || ''} /></label>
            <label>URL<input name="resourceUrl" placeholder="https://..." defaultValue={profile?.resources?.[0]?.url || ''} /></label>
          </div>
        </section>
        <section className="connect-form-section">
          <h2>Optional Smart Route</h2>
          <p>Route higher-intent connections to a specific link. Skip this for the MVP test.</p>
          <div className="connect-form-grid">
            <label>Label<input name="destinationLabel" placeholder="Book a call" defaultValue={profile?.destinations?.[0]?.label || ''} /></label>
            <label>URL<input name="destinationUrl" placeholder="https://..." defaultValue={profile?.destinations?.[0]?.url || ''} /></label>
          </div>
          <label>When priority is
            <select name="destinationPriority" defaultValue={profile?.destinations?.[0]?.priority || 'High'}>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </label>
        </section>
        <label>Welcome email subject<input name="welcomeEmailSubject" defaultValue={profile?.welcomeEmailSubject || ''} /></label>
        <label>Welcome email body<textarea name="welcomeEmailBody" rows={4} defaultValue={profile?.welcomeEmailBody || ''} /></label>
        <label>Notification email<input name="ownerNotificationEmail" type="email" defaultValue={profile?.ownerNotificationEmail || ''} /></label>
        <label className="connect-check"><input name="isActive" type="checkbox" defaultChecked={profile?.isActive ?? true} /> Active</label>
        {error ? <p className="connect-admin-error">{error}</p> : null}
        {status ? <p className="connect-admin-status">{status}</p> : null}
        <button type="submit">Save Profile</button>
      </form>
    </main>
  );
}
