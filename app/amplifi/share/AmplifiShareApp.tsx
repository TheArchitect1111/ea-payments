'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import CaptureSuccessPanel from '@/app/components/CaptureSuccessPanel';
import ActiveSavePanel from '@/app/components/ActiveSavePanel';
import CaptureProcessingPanel from '@/app/components/CaptureProcessingPanel';
import type { AmplifiSocialDraft } from '@/lib/amplifi-draft';
import GuidedFirstSuccessFlow from '@/app/components/guided-first-success/GuidedFirstSuccessFlow';
import UniversalCoachPanel from '@/app/components/guided-first-success/UniversalCoachPanel';
import { useProductGuestSession } from '@/components/auth/useProductGuestSession';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

interface AnalyzeResponse {
  ok?: boolean;
  error?: string;
  processing?: boolean;
  captureId?: string;
  record?: { id?: string; title?: string };
  considerUrl?: string;
  magnifiUrl?: string;
  guidanceUrl?: string;
  workspaceUrl?: string;
  clientMessage?: string;
  amplifiDraft?: AmplifiSocialDraft;
}

export default function AmplifiShareApp({
  slug,
  loggedIn,
  initialUrl,
}: {
  slug: string | null;
  loggedIn: boolean;
  initialUrl?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(initialUrl ?? '');
  const [prospectName, setProspectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);

  const { starting: guestStarting, error: guestError, startGuest } = useProductGuestSession({
    loggedIn,
    autoStart: true,
    initialUrl,
  });

  const loginNext = encodeURIComponent(
    initialUrl ? `/amplify?url=${encodeURIComponent(initialUrl)}` : '/amplifi/share',
  );

  useEffect(() => {
    if (loggedIn && initialUrl?.trim()) {
      setUrl(initialUrl);
    }
  }, [loggedIn, initialUrl]);

  useEffect(() => {
    if (loggedIn && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [loggedIn]);

  const handleResponse = (data: AnalyzeResponse) => {
    if (!data.ok) {
      setMessage(data.error ?? 'Amplifi could not build a share story.');
      return;
    }
    if (data.processing && data.captureId) {
      setProcessingId(data.captureId);
      setResult(data);
      setOpen(false);
      return;
    }
    setResult(data);
    setOpen(true);
  };

  const runCapture = useCallback(async (body: Record<string, string>) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/portal/captures/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      handleResponse((await res.json()) as AnalyzeResponse);
    } catch {
      setMessage('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loggedIn || !initialUrl?.trim() || autoStarted) return;
    setAutoStarted(true);
    setUrl(initialUrl);
    runCapture({ url: initialUrl.trim(), prospectName });
  }, [loggedIn, initialUrl, autoStarted, prospectName, runCapture]);

  const amplifyUrl = () => {
    if (!url.trim()) return;
    runCapture({ url: url.trim(), prospectName });
  };

  const amplifyCurrent = () => {
    if (typeof window !== 'undefined') {
      const current = window.location.href;
      setUrl(current);
      runCapture({ url: current, prospectName });
    }
  };

  if (!loggedIn) {
    return (
      <div className="as-app">
        <header className="as-header">
          <span className="as-brand">AMPLIFI™</span>
        </header>
        <main className="as-main as-main-center">
          <p className="as-kicker">Share more · Reach more</p>
          <h1 className="as-title">Amplify what you see</h1>
          <p className="as-lede">
            {guestStarting
              ? 'Starting your session…'
              : 'Turn any page, flyer, or idea into a shareable Magnifi story — one tap from your browser or phone.'}
          </p>
          {guestError ? <p className="as-error">{guestError}</p> : null}
          {!guestStarting && (
            <>
              <button type="button" className="as-btn as-btn-gold" onClick={() => void startGuest()}>
                Start amplifying now
              </button>
              <Link href={`/portal/login?next=${loginNext}`} className="as-link">
                Sign in with your account →
              </Link>
            </>
          )}
          <Link href="/amplifi/install" className="as-link">
            Install browser button →
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="as-app">
      <header className="as-header">
        <span className="as-brand">AMPLIFI™</span>
        <Link href="/amplifi/install" className="as-header-link">
          Install
        </Link>
      </header>

      <main className="as-main">
        <p className="as-kicker">Amplify mode</p>
        <h1 className="as-title">Make it visible.</h1>
        <p className="as-lede">
          Tap Amplify on anything worth sharing. Simplifi analyzes it in the background; Magnifi builds
          the story; you send the link.
        </p>
        {initialUrl && (
          <p className="as-prefill">
            Ready to amplify: <strong>{initialUrl.slice(0, 60)}…</strong>
          </p>
        )}
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a link to amplify"
          className="as-input"
        />
        <input
          value={prospectName}
          onChange={(e) => setProspectName(e.target.value)}
          placeholder="Who is this for? (optional)"
          className="as-input"
        />
        {message && <p className="as-error">{message}</p>}

        {processingId && (
          <div className="as-processing-banner">
            <CaptureProcessingPanel
              captureId={processingId}
              title={result?.record?.title}
              showActiveSave={Boolean(loggedIn && slug)}
              onComplete={() => setProcessingId(null)}
              onError={() => setProcessingId(null)}
            />
          </div>
        )}
      </main>

      {open && result?.record && !result.processing && (
        <div className="as-sheet as-sheet-open" role="dialog">
          {loggedIn && result.record.id && (
            <ActiveSavePanel
              recordId={result.record.id}
              title={result.record.title ?? 'Your Amplifi story'}
            />
          )}
          <CaptureSuccessPanel
            title={result.record.title ?? 'Your Amplifi story'}
            links={{
              magnifiUrl: result.magnifiUrl,
              considerUrl: result.considerUrl,
              guidanceUrl: result.guidanceUrl,
              workspaceUrl: result.workspaceUrl,
              clientMessage: result.clientMessage,
            }}
            amplifiDraft={result.amplifiDraft}
            onClose={() => setOpen(false)}
            autoOpenMagnifi
          />
        </div>
      )}

      {open && <div className="as-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}

      <button
        type="button"
        className="as-fab as-fab-secondary"
        disabled={loading}
        onClick={() => fileRef.current?.click()}
        style={{ backgroundColor: GOLD, color: NAVY, borderColor: NAVY, right: '92px' }}
        aria-label="Upload screenshot"
      >
        📷
      </button>

      <button
        type="button"
        className="as-fab"
        disabled={loading}
        onClick={() => {
          if (initialUrl || url.trim()) amplifyUrl();
          else amplifyCurrent();
        }}
        style={{ backgroundColor: NAVY, color: GOLD, borderColor: GOLD }}
      >
        {loading ? '…' : 'Amplify'}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        className="as-hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setLoading(true);
          const form = new FormData();
          form.append('file', file);
          if (prospectName) form.append('prospectName', prospectName);
          try {
            const res = await fetch('/api/portal/captures/analyze', { method: 'POST', body: form });
            handleResponse((await res.json()) as AnalyzeResponse);
          } finally {
            setLoading(false);
            if (fileRef.current) fileRef.current.value = '';
          }
        }}
      />

      {loggedIn && slug && (
        <>
          <GuidedFirstSuccessFlow platformId="amplifi" scope={slug} firstActionHref="/amplify" />
          <UniversalCoachPanel platformId="amplifi" />
        </>
      )}
    </div>
  );
}
