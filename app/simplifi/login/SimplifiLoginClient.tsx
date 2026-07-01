'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import RealmLoginCard from '@/components/auth/RealmLoginCard';
import { getRealmLoginCopy, magicLinkErrorMessage } from '@/lib/auth/realm-login-copy';
import '../../portal/login/portal-login.css';
import './simplifi-auth.css';

const copy = getRealmLoginCopy('simplifi');

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/simplifi/capture';
  return raw;
}

function SimplifiLoginInner() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const error = magicLinkErrorMessage('simplifi', searchParams.get('error'));

  return <RealmLoginCard realm="simplifi" next={nextPath} error={error} />;
}

export default function SimplifiLoginClient() {
  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image src="/simplifi-logo.png" alt="Simplifi" width={320} height={180} className="pl-logo" priority />
          <p className="pl-eyebrow">{copy.eyebrow}</p>
          <h1 className="pl-title">{copy.pageTitle}</h1>
          <p className="pl-lede">{copy.pageSubtitle}</p>
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
