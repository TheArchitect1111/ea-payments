'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import RealmLoginCard from '@/components/auth/RealmLoginCard';
import { getRealmLoginCopy, magicLinkErrorMessage } from '@/lib/auth/realm-login-copy';
import amandaPhoto from '@/public/home/client-amanda-catherine.jpg';
import './portal-login.css';

const copy = getRealmLoginCopy('portal');

/** Only honor same-origin relative next paths; otherwise let the auth exchange pick the client hub. */
function safeNextPath(raw: string | null): string | undefined {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return undefined;
  // Never send portal-realm logins into the Simplifi product shell by default.
  if (raw === '/simplifi/capture' || raw.startsWith('/simplifi/')) return undefined;
  return raw;
}

function isAmandaPortal(nextPath?: string) {
  const path = nextPath?.toLowerCase();
  return Boolean(
    path === '/amanda-business' || path?.startsWith('/portal/amanda-catherine'),
  );
}

function AmandaLoginBrand() {
  return (
    <>
      <header className="pl-header pl-header-amanda">
        <Image
          src={amandaPhoto}
          alt="Amanda Catherine"
          width={240}
          height={240}
          className="pl-amanda-photo"
          priority
        />
        <p className="pl-eyebrow">AesthetiKine Studio Lab</p>
        <h1 className="pl-title">Amanda Catherine Business Portal</h1>
        <p className="pl-lede">
          Sign in to manage programs, appointments, applications, payments, communications, people, and reports.
        </p>
        <p className="pl-portal-line">Private administrator access for Amanda Catherine</p>
      </header>

      <div className="pl-hero pl-amanda-hero" aria-label="Amanda Catherine portal areas">
        <div className="pl-amanda-hero-overlay">
          <p>AesthetiKine</p>
          <p>LIFELINE</p>
          <p>Training</p>
          <p>Community</p>
        </div>
      </div>
    </>
  );
}

function DefaultLoginBrand() {
  return (
    <>
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
        <p className="pl-portal-line">Sign in to your Client Experience</p>
      </header>

      <div className="pl-hero" aria-hidden={false}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="pl-hero-img"
          src="/client-experience/welcome-possibility-strip.png"
          alt="Welcoming collage of people living with ease and possibility"
          width={1200}
          height={640}
        />
      </div>
    </>
  );
}

function PortalLoginInner() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const error = magicLinkErrorMessage('portal', searchParams.get('error'));

  return <RealmLoginCard realm="portal" next={nextPath} error={error} showTitle={false} />;
}

function PortalLoginContent() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const amanda = isAmandaPortal(nextPath);

  return (
    <div className={`pl-page${amanda ? ' pl-page-amanda' : ''}`}>
      <div className="pl-shell">
        {amanda ? <AmandaLoginBrand /> : <DefaultLoginBrand />}

        <Suspense fallback={<div className="pl-card">Loading…</div>}>
          <PortalLoginInner />
        </Suspense>

        <footer className="pl-footer">
          {amanda ? (
            <p className="pl-tagline">Amanda Catherine portal access • Powered by Efficiency Architects</p>
          ) : (
            <>
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
              <p className="pl-tagline">You’re expected. We’re already preparing what comes next.</p>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={<div className="pl-page"><div className="pl-card">Loading…</div></div>}>
      <PortalLoginContent />
    </Suspense>
  );
}
