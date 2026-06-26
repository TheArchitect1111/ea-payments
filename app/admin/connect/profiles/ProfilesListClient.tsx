'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ConnectProfile } from '@/lib/connect-types';

export default function ProfilesListClient({ profiles }: { profiles: ConnectProfile[] }) {
  const [copied, setCopied] = useState('');

  async function copy(slug: string) {
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    await navigator.clipboard.writeText(`${origin}/connect/${slug}`);
    setCopied(slug);
    setTimeout(() => setCopied(''), 2200);
  }

  return (
    <section className="connect-profile-list">
      {profiles.map((profile) => (
        <article key={profile.id} className="connect-profile-row">
          <Link href={`/admin/connect/profiles/${profile.id}`} className="connect-profile-main">
            <strong>{profile.brandName}</strong>
            <span>/connect/{profile.slug}</span>
            <em>{profile.isActive ? 'Active' : 'Inactive'}</em>
          </Link>
          <div className="connect-profile-actions">
            <Link href={`/connect/${profile.slug}`}>Open</Link>
            <button type="button" onClick={() => copy(profile.slug)}>{copied === profile.slug ? 'Copied' : 'Copy'}</button>
          </div>
        </article>
      ))}
      {!profiles.length ? <p className="connect-empty">No profiles yet.</p> : null}
    </section>
  );
}
