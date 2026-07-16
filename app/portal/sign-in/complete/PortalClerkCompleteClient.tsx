'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import '../../login/portal-login.css';

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/simplifi/workspace';
  return raw;
}

export default function PortalClerkCompleteClient() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      const signInUrl = new URL('/portal/sign-in', window.location.origin);
      signInUrl.searchParams.set('next', nextPath);
      window.location.href = signInUrl.toString();
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/portal/clerk-bridge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          slug?: string;
          error?: string;
        };
        if (res.ok && json.ok) {
          window.location.href = nextPath;
          return;
        }
        if (!cancelled) {
          setError(json.error || 'No portal account matches that email. Try password login or contact support.');
        }
      } catch {
        if (!cancelled) setError('Sign-in could not be completed. Please try again.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken, nextPath]);

  return (
    <div className="pl-page">
      <div className="pl-shell">
        <div className="pl-card" style={{ textAlign: 'center' }}>
          <h1 className="pl-title">Signing you in</h1>
          {error ? (
            <>
              <p className="pl-error">{error}</p>
              <a className="pl-link" href="/portal/sign-in">Try a different account</a>
              <a className="pl-link" href="/portal/login">Use password instead</a>
            </>
          ) : (
            <p className="pl-lede">One moment while we match your email to your portal…</p>
          )}
        </div>
      </div>
    </div>
  );
}
