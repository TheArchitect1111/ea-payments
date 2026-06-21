'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import type { CaptureRecord } from '@/lib/capture-records';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';
const BLUE = '#0A66FF';

interface AnalyzeResponse {
  ok?: boolean;
  error?: string;
  record?: CaptureRecord;
  magnifiUrl?: string;
  guidanceUrl?: string;
  considerUrl?: string;
  clientMessage?: string;
}

type SheetView = 'menu' | 'url' | 'upload' | 'result';

export default function SimplifiCaptureApp({
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
  const [view, setView] = useState<SheetView>('menu');
  const [url, setUrl] = useState(initialUrl ?? '');
  const [prospectName, setProspectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const loginNext = encodeURIComponent('/simplifi/capture');

  const resetSheet = () => {
    setView('menu');
    setMessage('');
    setResult(null);
  };

  const closeSheet = () => {
    setOpen(false);
    resetSheet();
  };

  const analyzeJson = async (body: Record<string, string>) => {
    const res = await fetch('/api/portal/captures/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return (await res.json()) as AnalyzeResponse;
  };

  const analyzeForm = async (form: FormData) => {
    const res = await fetch('/api/portal/captures/analyze', { method: 'POST', body: form });
    return (await res.json()) as AnalyzeResponse;
  };

  const handleCaptureUrl = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const data = await analyzeJson({ url: url.trim(), prospectName });
      if (!data.ok) {
        setMessage(data.error ?? 'Could not capture this URL.');
        return;
      }
      setResult(data);
      setView('result');
    } catch {
      setMessage('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }, [url, prospectName]);

  const handleCaptureFile = async (file: File) => {
    setLoading(true);
    setMessage('');
    try {
      const form = new FormData();
      form.append('file', file);
      if (prospectName) form.append('prospectName', prospectName);
      const data = await analyzeForm(form);
      if (!data.ok) {
        setMessage(data.error ?? 'Could not capture this file.');
        return;
      }
      setResult(data);
      setView('result');
    } catch {
      setMessage('Network error. Try again.');
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const captureCurrentPage = () => {
    if (typeof window !== 'undefined' && window.location.href) {
      setUrl(window.location.href);
      setView('url');
    }
  };

  if (!loggedIn) {
    return (
      <div className="sc-app">
        <header className="sc-header">
          <Link href="/simplifi" className="sc-brand">
            SIMPLIFI
          </Link>
        </header>
        <main className="sc-main sc-main-center">
          <p className="sc-kicker">One-tap capture</p>
          <h1 className="sc-title">Sign in to capture opportunities</h1>
          <p className="sc-lede">
            Simplifi saves URLs, photos, and flyers from your phone — then builds Magnifi experiences
            you can share.
          </p>
          <Link href={`/portal/login?next=${loginNext}`} className="sc-btn sc-btn-primary">
            Sign in to Simplifi
          </Link>
          <p className="sc-demo-hint">
            Demo: demo@efficiencyarchitects.online / DemoPulse2026!
          </p>
        </main>
        <div className="sc-fab-placeholder" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="sc-app">
      <header className="sc-header">
        <Link href="/simplifi" className="sc-brand">
          SIMPLIFI
        </Link>
        {slug && (
          <Link href={`/portal/${slug}/simplifi`} className="sc-header-link">
            Workspace
          </Link>
        )}
      </header>

      <main className="sc-main">
        <p className="sc-kicker">Capture mode</p>
        <h1 className="sc-title">Tap the button. Never lose an opportunity.</h1>
        <p className="sc-lede">
          Paste a link, snap a flyer, or upload a screenshot. Simplifi scores it and Magnifi builds
          the shareable story.
        </p>
        <ul className="sc-steps">
          <li>Tap the gold Capture button</li>
          <li>Choose URL or photo</li>
          <li>Share the Consider or Magnifi link</li>
        </ul>
      </main>

      {open && (
        <div className="sc-backdrop" onClick={closeSheet} aria-hidden="true" />
      )}

      <div className={`sc-sheet${open ? ' sc-sheet-open' : ''}`} role="dialog" aria-modal={open}>
        {view === 'menu' && (
          <>
            <p className="sc-sheet-title">Capture opportunity</p>
            <button type="button" className="sc-sheet-action" onClick={() => setView('url')}>
              Paste a URL
            </button>
            <button
              type="button"
              className="sc-sheet-action"
              onClick={() => fileRef.current?.click()}
            >
              Photo or screenshot
            </button>
            <button type="button" className="sc-sheet-action" onClick={captureCurrentPage}>
              Use this page&apos;s link
            </button>
            <button type="button" className="sc-sheet-cancel" onClick={closeSheet}>
              Cancel
            </button>
          </>
        )}

        {view === 'url' && (
          <>
            <p className="sc-sheet-title">Paste URL</p>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="sc-input"
              autoFocus
            />
            <input
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              placeholder="Prospect name (optional)"
              className="sc-input"
            />
            {message && <p className="sc-error">{message}</p>}
            <button
              type="button"
              className="sc-btn sc-btn-primary sc-btn-block"
              disabled={loading || !url.trim()}
              onClick={handleCaptureUrl}
            >
              {loading ? 'Analyzing…' : 'Capture'}
            </button>
            <button type="button" className="sc-sheet-cancel" onClick={() => setView('menu')}>
              Back
            </button>
          </>
        )}

        {view === 'result' && result?.record && (
          <>
            <p className="sc-sheet-title">Captured</p>
            <p className="sc-result-name">{result.record.title}</p>
            <div className="sc-result-links">
              {result.considerUrl && (
                <a href={result.considerUrl} target="_blank" rel="noopener noreferrer">
                  Consider share link
                </a>
              )}
              {result.magnifiUrl && (
                <a href={result.magnifiUrl} target="_blank" rel="noopener noreferrer">
                  Magnifi cinematic
                </a>
              )}
              {result.guidanceUrl && (
                <a href={result.guidanceUrl} target="_blank" rel="noopener noreferrer">
                  Simplifi guidance
                </a>
              )}
            </div>
            <button type="button" className="sc-btn sc-btn-primary sc-btn-block" onClick={closeSheet}>
              Done
            </button>
          </>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleCaptureFile(file);
          }}
        />
      </div>

      <button
        type="button"
        className="sc-fab"
        aria-label="Capture opportunity"
        onClick={() => {
          resetSheet();
          setOpen(true);
        }}
        style={{ backgroundColor: GOLD, color: NAVY }}
      >
        <span className="sc-fab-icon">+</span>
        <span className="sc-fab-label">Capture</span>
      </button>
    </div>
  );
}
