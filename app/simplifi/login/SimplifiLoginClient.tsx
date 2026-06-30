'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import MagicLinkForm from '@/components/auth/MagicLinkForm';
import '../../portal/login/portal-login.css';
import './simplifi-auth.css';

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/simplifi/capture';
  return raw;
}

function errorMessage(code: string | null): string | null {
  switch (code) {
    case 'expired':
      return 'That login link expired. Request a new one below.';
    case 'unauthorized':
      return 'No Simplifi account matches that email.';
    case 'config':
      return 'Login is not configured. Contact support.';
    default:
      return null;
  }
}

function SimplifiLoginInner() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const error = errorMessage(searchParams.get('error'));

  return (
    <div className="pl-card">
      {error ? <p className="pl-error" role="alert">{error}</p> : null}
      <MagicLinkForm
        realm="simplifi"
        next={nextPath}
        title="Simplifi sign in"
        subtitle="Enter your email on file. We will send a one-tap login link — no password needed."
        buttonLabel="Email me a login link"
      />
    </div>
  );
}

export default function SimplifiLoginClient() {
  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image src="/simplifi-logo.png" alt="Simplifi" width={320} height={180} className="pl-logo" priority />
          <p className="pl-eyebrow">Never Lose An Opportunity Again™</p>
          <h1 className="pl-title">Welcome to Simplifi™</h1>
          <p className="pl-lede">
            Sign in to save opportunities, remember what matters, and follow up when the time is right.
          </p>
        </header>

        <Suspense fallback={<div className="pl-card">Loading...</div>}>
          <SimplifiLoginInner />
        </Suspense>

        <footer className="pl-footer">
          <p className="pl-footer-text">
            Full EA client portal?{' '}
            <Link href="/portal/login" className="pl-footer-link">
              Sign in here
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
