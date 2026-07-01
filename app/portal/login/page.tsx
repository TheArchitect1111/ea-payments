'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import RealmLoginCard from '@/components/auth/RealmLoginCard';
import { getRealmLoginCopy, magicLinkErrorMessage } from '@/lib/auth/realm-login-copy';
import './portal-login.css';

const copy = getRealmLoginCopy('portal');

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/simplifi/capture';
  return raw;
}

function PortalLoginInner() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const error = magicLinkErrorMessage('portal', searchParams.get('error'));

  return <RealmLoginCard realm="portal" next={nextPath} error={error} />;
}

export default function PortalLoginPage() {
  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image
            src="/simplifi-logo.png"
            alt="Simplifi"
            width={320}
            height={180}
            className="pl-logo"
            priority
          />
          <p className="pl-eyebrow">First Capture</p>
          <h1 className="pl-title">Sign in and capture your first item</h1>
          <p className="pl-lede">
            After login, Simplifi opens the capture screen. Paste a link or upload a screenshot first.
          </p>
        </header>

        <Suspense fallback={<div className="pl-card">Loading…</div>}>
          <PortalLoginInner />
        </Suspense>

        <footer className="pl-footer">
          <p className="pl-footer-text">
            Need the full client portal?{' '}
            <Link href="/partners/login" className="pl-footer-link">
              Partner sign in
            </Link>
          </p>
          <p className="pl-tagline">Systems that transform businesses.</p>
        </footer>
      </div>
    </div>
  );
}
