'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import RealmLoginCard from '@/components/auth/RealmLoginCard';
import './portal-login.css';

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/simplifi/capture';
  return raw;
}

function errorMessage(code: string | null): string | null {
  switch (code) {
    case 'expired':
      return 'That login link expired. Request a new one below.';
    case 'unauthorized':
      return 'No account matches that email. Use the email from your welcome message.';
    case 'config':
      return 'Login is not configured. Contact support.';
    default:
      return null;
  }
}

function PortalLoginInner() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const error = errorMessage(searchParams.get('error'));

  return (
    <RealmLoginCard
      realm="portal"
      next={nextPath}
      error={error}
      title="Portal sign in"
      subtitle="Enter your email on file. We will send a one-tap login link — no password needed."
      buttonLabel="Email me a login link"
    />
  );}

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
