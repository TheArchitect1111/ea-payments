'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import RealmLoginCard from '@/components/auth/RealmLoginCard';
import { getRealmLoginCopy, magicLinkErrorMessage } from '@/lib/auth/realm-login-copy';
import './portal-login.css';

const copy = getRealmLoginCopy('portal');

/** Only honor same-origin relative next paths; otherwise let the auth exchange pick the client hub. */
function safeNextPath(raw: string | null): string | undefined {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return undefined;
  // Never send portal-realm logins into the Simplifi product shell by default.
  if (raw === '/simplifi/capture' || raw.startsWith('/simplifi/')) return undefined;
  return raw;
}

function PortalLoginInner() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const error = magicLinkErrorMessage('portal', searchParams.get('error'));

  return <RealmLoginCard realm="portal" next={nextPath} error={error} showTitle={false} />;
}

export default function PortalLoginPage() {
  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image
            src="/ea-logo.png"
            alt="Efficiency Architects"
            width={200}
            height={200}
            className="pl-logo"
            priority
          />
          {copy.eyebrow ? <p className="pl-eyebrow">{copy.eyebrow}</p> : null}
          <h1 className="pl-title">{copy.pageTitle}</h1>
          <p className="pl-lede">{copy.pageSubtitle}</p>
        </header>

        <Suspense fallback={<div className="pl-card">Loading…</div>}>
          <PortalLoginInner />
        </Suspense>

        <footer className="pl-footer">
          <p className="pl-footer-text">
            Looking for Simplifi capture?{' '}
            <Link href="/simplifi/login" className="pl-footer-link">
              Simplifi sign in
            </Link>
          </p>
          <p className="pl-footer-text">
            Partner account?{' '}
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
