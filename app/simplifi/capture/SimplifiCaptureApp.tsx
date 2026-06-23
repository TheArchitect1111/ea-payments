'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CaptureRecord } from '@/lib/capture-records';
import CaptureSuccessPanel from '@/app/components/CaptureSuccessPanel';
import CaptureProcessingPanel from '@/app/components/CaptureProcessingPanel';
import SimplifiOnboardingFlow from '@/app/components/simplifi-onboarding/SimplifiOnboardingFlow';
import type { AmplifiSocialDraft } from '@/lib/amplifi-draft';
import {
  incrementCaptureCount,
  isOnboardingComplete,
  setOnboardingStep as persistOnboardingStep,
  type SimplifiOnboardingStep,
} from '@/lib/simplifi-onboarding';
import { prepareCaptureUpload } from '@/lib/client-image-upload';
import { useProductGuestSession } from '@/components/auth/useProductGuestSession';

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
  workspaceUrl?: string;
  amplifiDraft?: AmplifiSocialDraft;
}

type SheetView = 'menu' | 'url' | 'upload' | 'processing' | 'result';

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
  const [uploadLabel, setUploadLabel] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [externalOnboardingStep, setExternalOnboardingStep] = useState<SimplifiOnboardingStep | null>(null);

  const loginNext = encodeURIComponent('/simplifi/capture');
  const onboardingScope = slug ?? 'simplifi-user';

  const { starting: guestStarting, error: guestError, startGuest } = useProductGuestSession({
    loggedIn,
    autoStart: true,
    initialUrl,
  });

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
    setUploadLabel('');
    setResult(null);
  };

  const openSheet = () => {
    setMessage('');
    setUploadLabel('');
    if (!processingId) {
      setResult(null);
    }
    setView(processingId ? 'processing' : 'menu');
    setOpen(true);
  };

  const closeSheet = () => {
    setOpen(false);
    if (processingId) {
      setMessage('');
      setUploadLabel('');
      setView('menu');
      return;
    }
    resetSheet();
  };

  const parseAnalyzeResponse = async (res: Response): Promise<AnalyzeResponse> => {
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      if (res.status === 413) {
        return { ok: false, error: 'Image is too large. Try a smaller photo or screenshot.' };
      }
      return { ok: false, error: `Upload failed (${res.status}). Try again.` };
    }
    const data = (await res.json()) as AnalyzeResponse;
    if (!res.ok && !data.error) {
      return { ok: false, error: 'Could not capture. Try again.' };
    }
    return data;
  };

  const analyzeJson = async (body: Record<string, string>) => {
    const res = await fetch('/api/portal/captures/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return parseAnalyzeResponse(res);
  };

  const analyzeForm = async (form: FormData) => {
    const res = await fetch('/api/portal/captures/analyze', { method: 'POST', body: form });
    return parseAnalyzeResponse(res);
  };

  const handleAnalyzeResponse = (data: AnalyzeResponse, source: 'url' | 'file' = 'url') => {
    if (!data.ok) {
      setMessage(data.error ?? 'Could not capture.');
      setView(source === 'file' ? 'upload' : 'url');
      return;
    }
    if (data.processing && data.captureId) {
      setProcessingId(data.captureId);
      setResult(data);
      setView('processing');
      setOpen(true);
      return;
    }
    setResult(data);
    setView('result');
    setOpen(true);
    if (loggedIn) {
      incrementCaptureCount(onboardingScope);
      if (!isOnboardingComplete(onboardingScope)) {
        persistOnboardingStep(onboardingScope, 'capture-success');
        setExternalOnboardingStep('capture-success');
      }
    }
  };

  const handleCaptureUrl = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const data = await analyzeJson({ url: url.trim(), prospectName });
      handleAnalyzeResponse(data, 'url');
    } catch {
      setMessage('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }, [url, prospectName]);

  const handleCaptureFile = async (file: File) => {
    setLoading(true);
    setMessage('');
    setUploadLabel(file.name);
    setView('upload');
    setOpen(true);
    try {
      const prepared = await prepareCaptureUpload(file);
      const form = new FormData();
      form.append('file', prepared);
      if (prospectName) form.append('prospectName', prospectName);
      const data = await analyzeForm(form);
      handleAnalyzeResponse(data, 'file');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error. Try again.';
      setMessage(msg);
      setView('upload');
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
          <div className="sc-brand-lockup">
            <Image src="/simplifi-logo.png" alt="Simplifi" width={170} height={96} priority />
          </div>
        </header>
        <main className="sc-main sc-main-center">
          <p className="sc-kicker">Never Lose An Opportunity Again™</p>
          <h1 className="sc-title">
            {guestStarting ? 'Getting ready…' : 'Save what matters before it slips away'}
          </h1>
          <p className="sc-lede">
            Simplifi helps you save opportunities, remember them, and act when the time is right.
          </p>
          {guestError ? <p className="sc-error">{guestError}</p> : null}
          {!guestStarting && (
            <>
              <button type="button" className="sc-btn sc-btn-primary" onClick={() => void startGuest()}>
                Start capturing now
              </button>
              <Link href={`/simplifi/login?next=${loginNext}`} className="sc-header-link">
                Sign in with your account →
              </Link>
            </>
          )}
        </main>
        <div className="sc-fab-placeholder" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="sc-app">
      <header className="sc-header">
        <div className="sc-brand-lockup">
          <Image src="/simplifi-logo.png" alt="Simplifi" width={170} height={96} priority />
        </div>
        {slug ? (
          <Link href="/simplifi/workspace" className="sc-header-link">
            My opportunities
          </Link>
        ) : (
          <Link href="/simplifi/workspace" className="sc-header-link">
            My dashboard
          </Link>
        )}
      </header>

      <main className="sc-main">
        <p className="sc-kicker">Never Lose An Opportunity Again™</p>
        <h1 className="sc-title">Let&apos;s capture your first opportunity.</h1>
        <p className="sc-lede">
          Paste a link, upload a screenshot, save a flyer, or capture something worth remembering.
        </p>

        <section className="sc-first-capture" aria-label="Capture your first item">
          <label className="sc-field-label" htmlFor="first-capture-url">
            Paste a link
          </label>
          <div className="sc-inline-capture">
            <input
              id="first-capture-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="sc-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && url.trim() && !loading) void handleCaptureUrl();
              }}
            />
            <button
              type="button"
              className="sc-btn sc-btn-primary"
              disabled={loading || !url.trim()}
              onClick={handleCaptureUrl}
            >
              {loading ? 'Capturing...' : 'Capture link'}
            </button>
          </div>
          <p className="sc-divider">or</p>
          <label className="sc-btn sc-btn-capture-main sc-file-label">
            Upload screenshot or flyer
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,application/pdf"
              className="sc-file-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleCaptureFile(file);
              }}
            />
          </label>
        </section>

        <ol className="sc-steps sc-steps-numbered">
          <li><strong>Save it:</strong> capture what caught your attention.</li>
          <li><strong>Understand it:</strong> Simplifi creates a clear summary.</li>
          <li><strong>Act on it:</strong> follow up when the time is right.</li>
        </ol>
        <button
          type="button"
          className="sc-secondary-link"
          onClick={openSheet}
        >
          More capture options
        </button>

        {processingId && !open && (
          <div className="sc-processing-banner">
            <CaptureProcessingPanel
              captureId={processingId}
              title={result?.record?.title}
              showActiveSave={loggedIn}
              variant="capture"
              onComplete={() => setProcessingId(null)}
              onError={() => {}}
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
            {message && <p className="sc-error">{message}</p>}
            <button type="button" className="sc-sheet-action" onClick={() => setView('url')}>
              Paste URL
            </button>
            <label className="sc-sheet-action sc-file-label">
              Upload Screenshot
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf,application/pdf"
                className="sc-file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleCaptureFile(file);
                }}
              />
            </label>
            <label className="sc-sheet-action sc-file-label">
              Upload Flyer
              <input
                type="file"
                accept="image/*,.pdf,application/pdf"
                className="sc-file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleCaptureFile(file);
                }}
              />
            </label>
            <button type="button" className="sc-sheet-action" onClick={captureCurrentPage}>
              Use Current Page
            </button>
            <button
              type="button"
              className="sc-sheet-action"
              onClick={() => {
                setProspectName('');
                setView('url');
              }}
            >
              Add Quick Note
            </button>
            <button type="button" className="sc-sheet-cancel" onClick={closeSheet}>
              Cancel
            </button>
          </>
        )}

        {view === 'upload' && (
          <>
            <p className="sc-sheet-title">{loading ? 'Uploading capture' : 'Photo upload'}</p>
            <div className="sc-uploading">
              {loading && <div className="sc-spinner" aria-hidden="true" />}
              <p className="sc-processing-message">
                {loading
                  ? `Sending ${uploadLabel || 'your image'} to Simplifi…`
                  : uploadLabel
                    ? `Ready to retry: ${uploadLabel}`
                    : 'Choose a photo or screenshot to capture.'}
              </p>
            </div>
            {message && <p className="sc-error">{message}</p>}
            {!loading && (
              <>
                <label className="sc-btn sc-btn-primary sc-btn-block sc-file-label">
                  Choose another image
                  <input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    className="sc-file-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleCaptureFile(file);
                      e.target.value = '';
                    }}
                  />
                </label>
                <button type="button" className="sc-sheet-cancel" onClick={() => setView('menu')}>
                  Back
                </button>
              </>
            )}
          </>
        )}

        {view === 'processing' && processingId && (
          <>
            <p className="sc-sheet-title">Building your capture</p>
            <CaptureProcessingPanel
              captureId={processingId}
              title={result?.record?.title}
              showActiveSave={loggedIn}
              variant="capture"
              onComplete={(response) => {
                setProcessingId(null);
                setResult(response);
                setView('result');
                if (loggedIn) {
                  incrementCaptureCount(onboardingScope);
                  if (!isOnboardingComplete(onboardingScope)) {
                    persistOnboardingStep(onboardingScope, 'capture-success');
                    setExternalOnboardingStep('capture-success');
                  }
                }
              }}
              onError={(msg) => setMessage(msg)}
            />
            <button
              type="button"
              className="sc-sheet-cancel"
              onClick={() => {
                setOpen(false);
                setView('menu');
              }}
            >
              Minimize — keep processing in background
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

        {view === 'result' && result?.record && (
          <>
            <p className="sc-sheet-title">Nice capture</p>
            <CaptureSuccessPanel
              title={result.record.title ?? 'Opportunity'}
              links={{
                magnifiUrl: result.magnifiUrl,
                considerUrl: result.considerUrl,
                guidanceUrl: result.guidanceUrl,
                workspaceUrl: '/simplifi/workspace',
                clientMessage: result.clientMessage,
              }}
              onClose={closeSheet}
              onContinue={() => {
                if (!isOnboardingComplete(onboardingScope)) {
                  persistOnboardingStep(onboardingScope, 'capture-success');
                  setExternalOnboardingStep('capture-success');
                }
              }}
            />
          </>
        )}

      </div>

      <button
        type="button"
        className="sc-fab"
        aria-label="Capture opportunity"
        onClick={openSheet}
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

      {loggedIn && (
        <SimplifiOnboardingFlow
          scope={onboardingScope}
          onStartCapture={() => {
            setOpen(true);
            setView('menu');
          }}
          externalStep={externalOnboardingStep}
          onExternalStepHandled={() => setExternalOnboardingStep(null)}
        />
      )}
    </div>
  );
}
