'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import type { CaptureRecord } from '@/lib/capture-records';
import CaptureSuccessPanel from '@/app/components/CaptureSuccessPanel';
import CaptureProcessingPanel from '@/app/components/CaptureProcessingPanel';
import GuidedFirstSuccessFlow from '@/app/components/guided-first-success/GuidedFirstSuccessFlow';
import UniversalCoachPanel from '@/app/components/guided-first-success/UniversalCoachPanel';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

interface AnalyzeResponse {
  ok?: boolean;
  error?: string;
  processing?: boolean;
  captureId?: string;
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
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loginNext = encodeURIComponent('/simplifi/capture');

  useEffect(() => {
    if (loggedIn && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [loggedIn]);

  useEffect(() => {
    if (loggedIn && initialUrl?.trim()) {
      setUrl(initialUrl);
      setOpen(true);
      setView('url');
    }
  }, [loggedIn, initialUrl]);

  const resetSheet = () => {
    setView('menu');
    setMessage('');
    setResult(null);
    setProcessingId(null);
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

  const handleAnalyzeResponse = (data: AnalyzeResponse) => {
    if (!data.ok) {
      setMessage(data.error ?? 'Could not capture.');
      return;
    }
    if (data.processing && data.captureId) {
      setProcessingId(data.captureId);
      setResult(data);
      setOpen(false);
      setView('menu');
      return;
    }
    setResult(data);
    setView('result');
    setOpen(true);
  };

  const handleCaptureUrl = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const data = await analyzeJson({ url: url.trim(), prospectName });
      handleAnalyzeResponse(data);
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
      handleAnalyzeResponse(data);
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
        <button
          type="button"
          className="sc-btn sc-btn-capture-main"
          onClick={() => {
            resetSheet();
            setOpen(true);
          }}
        >
          Capture now
        </button>

        {processingId && (
          <div className="sc-processing-banner">
            <CaptureProcessingPanel
              captureId={processingId}
              title={result?.record?.title}
              onComplete={() => setProcessingId(null)}
              onError={() => setProcessingId(null)}
            />
          </div>
        )}
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
              {loading ? 'Capturing…' : 'Capture'}
            </button>
            <button type="button" className="sc-sheet-cancel" onClick={() => setView('menu')}>
              Back
            </button>
          </>
        )}

        {view === 'result' && result?.record && !result.processing && (
          <>
            <p className="sc-sheet-title">Pipeline complete</p>
            <CaptureSuccessPanel
              title={result.record.title ?? 'Opportunity'}
              links={{
                magnifiUrl: result.magnifiUrl,
                considerUrl: result.considerUrl,
                guidanceUrl: result.guidanceUrl,
                clientMessage: result.clientMessage,
              }}
              onClose={closeSheet}
              autoOpenMagnifi
            />
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
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          zIndex: 9999,
          backgroundColor: GOLD,
          color: NAVY,
        }}
      >
        <span className="sc-fab-icon">+</span>
        <span className="sc-fab-label">Capture</span>
      </button>

      {loggedIn && slug && (
        <>
          <GuidedFirstSuccessFlow platformId="simplifi" scope={slug} />
          <UniversalCoachPanel platformId="simplifi" />
        </>
      )}
    </div>
  );
}
