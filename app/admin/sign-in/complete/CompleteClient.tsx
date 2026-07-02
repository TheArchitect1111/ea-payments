'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import '../../../portal/login/portal-login.css';

export default function CompleteClient() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      window.location.href = '/admin/sign-in';
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/admin/clerk-bridge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (res.ok) {
          window.location.href = '/admin/master';
          return;
        }
        const json = await res.json().catch(() => ({}));
        if (!cancelled) setError(json.error || 'You are not authorized for admin access.');
      } catch {
        if (!cancelled) setError('Sign-in could not be completed. Please try again.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  return (
    <div className="pl-page">
      <div className="pl-shell">
        <div className="pl-card" style={{ textAlign: 'center' }}>
          <h1 className="pl-title">Signing you in</h1>
          {error ? (
            <>
              <p className="pl-error">{error}</p>
              <a className="pl-link" href="/admin/sign-in">Try a different account</a>
              <a className="pl-link" href="/admin/login">Use password instead</a>
            </>
          ) : (
            <p className="pl-lede">One moment while we confirm your access…</p>
          )}
        </div>
      </div>
    </div>
  );
}
