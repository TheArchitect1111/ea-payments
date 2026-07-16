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
import { analyzeCaptureForm, analyzeCaptureUrl } from '@/lib/simplifi-client';
import { enqueueCapture, flushCaptureQueue } from '@/lib/offline-capture-queue';
import { useProductGuestSession } from '@/components/auth/useProductGuestSession';
import { NAVY, GOLD } from '@/lib/design-system';
import {
  clearGuestCaptureIds,
  clearProcessingCaptureId,
  readGuestCaptureIds,
  readProcessingCaptureId,
  rememberGuestCaptureId,
  stashProcessingCaptureId,
} from '@/lib/capture-upload-limits';

const CAPTURE_OUTCOME_TAGLINE = 'Save what matters. Follow up when it\'s time.';

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
  initialNotes,
}: {
  slug: string | null;
  loggedIn: boolean;
  initialUrl?: string;
  initialNotes?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const hasShareSeed = Boolean(initialUrl?.trim() || initialNotes?.trim());
  const [open, setOpen] = useState(hasShareSeed);
  const [view, setView] = useState<SheetView>(hasShareSeed ? 'url' : 'menu');
  const [url, setUrl] = useState(initialUrl ?? '');
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [prospectName, setProspectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState('');
  const [externalOnboardingStep, setExternalOnboardingStep] = useState<SimplifiOnboardingStep | null>(null);

  const loginNext = encodeURIComponent('/simplifi/workspace');
  const onboardingScope = slug ?? 'simplifi-user';
  const isGuestDemo = slug === 'demo-client';

  const { starting: guestStarting, error: guestError, startGuest } = useProductGuestSession({
    loggedIn,
    autoStart: true,
    initialUrl,
  });

  useEffect(() => {
    const stored = readProcessingCaptureId();
    if (stored) setProcessingId(stored);
  }, []);

  useEffect(() => {
    if (!loggedIn || !slug || slug === 'demo-client') return;
    const ids = readGuestCaptureIds();
    if (!ids.length) return;

    void fetch('/api/portal/captures/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ captureIds: ids }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { ok?: boolean; claimed?: number };
        if (res.ok && data.ok && (data.claimed ?? 0) > 0) {
          clearGuestCaptureIds();
          setMessage(`Moved ${data.claimed} guest capture${data.claimed === 1 ? '' : 's'} into your workspace.`);
        }
      })
      .catch(() => {});
  }, [loggedIn, slug]);

  useEffect(() => {
    if (!loggedIn) return;

    const flushQueued = async () => {
      const result = await flushCaptureQueue(async (item) => {
        if (item.kind !== 'url') return { ok: false };
        return analyzeCaptureUrl({
          url: item.url,
          prospectName: item.prospectName,
          notes: item.notes,
        });
      });
      if (result.flushed > 0) {
        setMessage(`Sent ${result.flushed} queued capture${result.flushed === 1 ? '' : 's'}.`);
      }
    };

    void flushQueued();
    window.addEventListener('online', flushQueued);
    return () => window.removeEventListener('online', flushQueued);
  }, [loggedIn]);

  useEffect(() => {
    if (loggedIn && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [loggedIn]);

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


  const analyzeJson = async (body: { url?: string; prospectName?: string; notes?: string }) =>
    analyzeCaptureUrl(body);

  const analyzeForm = async (form: FormData) => analyzeCaptureForm(form);

  const handleAnalyzeResponse = (data: AnalyzeResponse, source: 'url' | 'file' = 'url') => {
    if (!data.ok) {
      setMessage(data.error ?? 'Could not capture.');
      setView(source === 'file' ? 'upload' : 'url');
      return;
    }
    if (data.processing && data.captureId) {
      setProcessingId(data.captureId);
      stashProcessingCaptureId(data.captureId);
      if (isGuestDemo || !slug || slug === 'demo-client') {
        rememberGuestCaptureId(data.captureId);
      }
      setResult(data);
      setView('processing');
      setOpen(true);
      return;
    }
    if (data.captureId && (isGuestDemo || !slug || slug === 'demo-client')) {
      rememberGuestCaptureId(data.captureId);
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
    const trimmedUrl = url.trim();
    const trimmedNotes = notes.trim();
    if (!trimmedUrl && !trimmedNotes) return;
    setLoading(true);
    setMessage('');
    try {
      const data = await analyzeJson({
        url: trimmedUrl || undefined,
        prospectName,
        notes: trimmedNotes || undefined,
      });
      handleAnalyzeResponse(data as AnalyzeResponse, 'url');
    } catch {
      if (loggedIn && typeof navigator !== 'undefined' && !navigator.onLine && trimmedUrl) {
        await enqueueCapture({ kind: 'url', url: trimmedUrl, prospectName, notes: trimmedNotes || undefined });
        setMessage('Offline — capture queued. We will send when you are back online.');
      } else {
        setMessage('Network error. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [url, notes, prospectName, loggedIn]);

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
        <nav className="sc-header-nav" aria-label="Simplifi">
          <Link href="/simplifi/workspace" className="sc-header-link">
            Brief
          </Link>
          <Link href="/simplifi/inbox" className="sc-header-link">
            Inbox
          </Link>
          <Link href="/simplifi/settings" className="sc-header-link">
            Settings
          </Link>
        </nav>
      </header>

      <main className="sc-main">
        <p className="sc-kicker">Quick capture</p>
        <h1 className="sc-title">Save it. Simplifi will tell you when it matters.</h1>
        <p className="sc-lede">
          Paste a link, upload a screenshot, or save a flyer — then return to Today&apos;s Brief.
        </p>
        <p className="sc-platform-purpose">{CAPTURE_OUTCOME_TAGLINE}</p>

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
        <p className="sc-next-step">
          After you capture, open{' '}
          <Link href="/simplifi/workspace">Today&apos;s Brief</Link>
          {' '}or your{' '}
          {slug ? (
            <Link href="/simplifi/inbox">Opportunity Inbox</Link>
          ) : (
            <Link href={`/portal/login?next=${loginNext}`}>signed-in inbox</Link>
          )}
          .
        </p>
        {isGuestDemo ? (
          <p className="sc-guest-banner">
            You&apos;re capturing as a guest.{" "}
            <Link href={`/portal/login?next=${loginNext}`}>Sign in</Link> to keep these captures in
            your own workspace.
          </p>
        ) : null}
        <button
          type="button"
          className="sc-secondary-link"
          onClick={openSheet}
        >
          More capture options
        </button>

        {bannerError ? <p className="sc-error">{bannerError}</p> : null}

        {processingId && !open && (
          <div className="sc-processing-banner">
            <CaptureProcessingPanel
              captureId={processingId}
              title={result?.record?.title}
              showActiveSave={loggedIn}
              variant="capture"
              onComplete={() => {
                clearProcessingCaptureId();
                setProcessingId(null);
                setBannerError('');
              }}
              onError={(msg) => setBannerError(msg)}
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
                clearProcessingCaptureId();
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
            <p className="sc-sheet-title">{url.trim() ? 'Paste URL' : notes.trim() ? 'Shared note' : 'Paste URL'}</p>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="sc-input"
              autoFocus={!notes.trim()}
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes from share sheet (optional)"
              className="sc-input"
              rows={3}
              aria-label="Capture notes"
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
              disabled={loading || (!url.trim() && !notes.trim())}
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
