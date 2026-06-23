'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useProductGuestSession } from '@/components/auth/useProductGuestSession';

export default function ExtensionConnectClient({ loggedIn }: { loggedIn: boolean }) {
  const [status, setStatus] = useState<'loading' | 'connected' | 'needs-session' | 'error'>(
    loggedIn ? 'loading' : 'needs-session',
  );
  const [message, setMessage] = useState(
    loggedIn ? 'Connecting your browser extension…' : 'Start a session to connect your extension.',
  );
  const { starting, error, startGuest } = useProductGuestSession({
    loggedIn,
    autoStart: !loggedIn,
  });

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type !== 'EA_CONNECT_STATUS') return;
      if (event.data.ok) {
        setStatus('connected');
        setMessage('Extension connected. You can close this tab and use Capture or Amplify on any site.');
      } else {
        setStatus('error');
        setMessage(event.data.error ?? 'Extension did not connect.');
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const displayStatus = error ? 'needs-session' : status;
  const displayMessage = error ?? message;

  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <p className="pl-eyebrow">Browser extension</p>
          <h1 className="pl-title">Connect Amplifi + Simplifi</h1>
          <p className="pl-lede">
            One click links your extension to Efficiency Architects — no manual API key required.
          </p>
        </header>

        <div className="pl-card">
          {displayStatus === 'connected' ? (
            <p className="pl-success">{displayMessage}</p>
          ) : displayStatus === 'loading' || starting ? (
            <p className="pl-footer-text">{starting ? 'Starting guest session…' : displayMessage}</p>
          ) : (
            <>
              <p className="pl-error">{displayMessage}</p>
              <button type="button" className="pl-btn" onClick={() => void startGuest()}>
                Start guest session & connect
              </button>
              <p className="pl-footer-text" style={{ marginTop: 16 }}>
                Or{' '}
                <Link href="/portal/login?next=%2Fextension%2Fconnect" className="pl-footer-link">
                  sign in with your account
                </Link>
              </p>
            </>
          )}
        </div>

        <footer className="pl-footer">
          <p className="pl-footer-text">
            <Link href="/amplifi/install" className="pl-footer-link">
              Back to install guide
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
