'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import CaptureSuccessPanel from '@/app/components/CaptureSuccessPanel';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

interface AnalyzeResponse {
  ok?: boolean;
  error?: string;
  record?: { title?: string };
  considerUrl?: string;
  magnifiUrl?: string;
  guidanceUrl?: string;
  clientMessage?: string;
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

  const loginNext = encodeURIComponent('/amplifi/share');

  useEffect(() => {
    if (loggedIn && initialUrl?.trim()) {
      setUrl(initialUrl);
    }
  }, [loggedIn, initialUrl]);

  const runCapture = useCallback(async (body: Record<string, string>) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/portal/captures/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as AnalyzeResponse;
      if (!data.ok) {
        setMessage(data.error ?? 'Amplifi could not build a share story.');
        return;
      }
      setResult(data);
      setOpen(true);
    } catch {
      setMessage('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const amplifyUrl = () => {
    if (!url.trim()) return;
    runCapture({ url: url.trim(), prospectName });
  };

  const amplifyCurrent = () => {
    if (typeof window !== 'undefined') {
      setUrl(window.location.href);
      runCapture({ url: window.location.href, prospectName });
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
            Turn any page, flyer, or idea into a shareable Magnifi story — one tap from your browser or
            phone.
          </p>
          <Link href={`/portal/login?next=${loginNext}`} className="as-btn as-btn-gold">
            Sign in to Amplifi
          </Link>
          <p className="as-demo">Demo: demo@efficiencyarchitects.online / DemoPulse2026!</p>
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
          Tap Amplify on anything worth sharing. Simplifi analyzes it; Magnifi builds the story; you
          send the link.
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
      </main>

      {open && result?.record && (
        <div className="as-sheet as-sheet-open" role="dialog">
          <CaptureSuccessPanel
            title={result.record.title ?? 'Your Amplifi story'}
            links={{
              magnifiUrl: result.magnifiUrl,
              considerUrl: result.considerUrl,
              guidanceUrl: result.guidanceUrl,
              clientMessage: result.clientMessage,
            }}
            onClose={() => setOpen(false)}
            autoOpenMagnifi
          />
        </div>
      )}

      {open && <div className="as-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}

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
            const data = (await res.json()) as AnalyzeResponse;
            if (data.ok) {
              setResult(data);
              setOpen(true);
            } else {
              setMessage(data.error ?? 'Could not amplify this file.');
            }
          } finally {
            setLoading(false);
            if (fileRef.current) fileRef.current.value = '';
          }
        }}
      />
    </div>
  );
}
