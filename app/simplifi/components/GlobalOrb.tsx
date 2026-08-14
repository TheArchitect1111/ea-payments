'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ActionCenterPayload } from '@/lib/action-center';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import {
  buildAmbientOpeningFromSession,
  deriveOrbSession,
  subscribeOrbOutcomeFlash,
  type OrbBriefSlice,
  type OrbOutcomeFlash,
  type OrbVisualState,
} from '@/lib/orb';
import { interpretOrbIntent, isOrbSessionSurface, resolveOrbIntentHref } from '@/lib/orb-os';
import { resolveChromeFadeClient } from '@/lib/simplifi/chrome-fade';
import {
  answerConversationalAskDetailed,
  searchOpportunities,
  type AskCitation,
} from '@/lib/simplifi-ask';
import { pushAskHistory } from '@/lib/simplifi/ask-session-history';
import { explainRecommendation } from '@/lib/simplifi-guidance-system';
import { analyzeCaptureUrl } from '@/lib/simplifi-client';
import AskAnswerBody from './AskAnswerBody';
import SessionWorkspace, { type SessionView } from './session/SessionWorkspace';
import './global-orb.css';

const OUTCOME_FLASH_MS = 1200;
const SPEAKING_MS = 1600;
const TAP_DELAY_MS = 260;
const HOLD_DELAY_MS = 560;
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function sessionViewForSurface(surface: string, draft?: string): SessionView | null {
  switch (surface) {
    case 'inbox':
      return { kind: 'inbox' };
    case 'followups':
      return { kind: 'followups' };
    case 'calendar':
      return { kind: 'calendar' };
    case 'capture':
      return { kind: 'capture', draft };
    default:
      return null;
  }
}

function sessionViewFromHref(href: string): SessionView | null {
  try {
    const u = new URL(href, 'https://efficiencyarchitects.online');
    const path = u.pathname;
    if (path.includes('/follow-ups')) return { kind: 'followups' };
    if (path.includes('/simplifi/inbox') || path.endsWith('/inbox')) return { kind: 'inbox' };
    if (path.includes('/calendar')) return { kind: 'calendar' };
    if (path.includes('/capture')) {
      return {
        kind: 'capture',
        draft: u.searchParams.get('text') || u.searchParams.get('url') || undefined,
      };
    }
    const match = path.match(/\/simplifi\/opportunity\/([^/]+)/);
    if (match?.[1]) return { kind: 'opportunity', id: match[1] };
  } catch {
    // ignore malformed hrefs
  }
  return null;
}

export default function GlobalOrb({
  slug,
  loggedIn,
  brief,
  objects,
  actionCenter,
  entityId,
}: {
  slug: string | null;
  loggedIn: boolean;
  brief: OrbBriefSlice;
  objects: SimplifiObject[];
  actionCenter: ActionCenterPayload;
  entityId?: string | null;
}) {
  const pathname = usePathname() || '/simplifi/workspace';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [interaction, setInteraction] = useState<'listening' | 'thinking' | 'speaking' | null>(null);
  const [askInput, setAskInput] = useState('');
  const [askAnswer, setAskAnswer] = useState('');
  const [askCitations, setAskCitations] = useState<AskCitation[]>([]);
  const [ambientOpener, setAmbientOpener] = useState('');
  const [outcomeFlash, setOutcomeFlash] = useState<OrbOutcomeFlash | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [sessionView, setSessionView] = useState<SessionView | null>(null);
  const [paused, setPaused] = useState(false);
  const [captureNotice, setCaptureNotice] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const askInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const ambientShownRef = useRef(false);
  const outcomeTimerRef = useRef<number | null>(null);
  const speakingTimerRef = useRef<number | null>(null);
  const tapTimerRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const heldRef = useRef(false);
  const panelId = 'simplifi-orb-panel';

  useEffect(() => {
    const sync = () => setOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  // Pause breathing / liquid light when the tab is inactive (battery + calm presence).
  useEffect(() => {
    const syncPaused = () => setPaused(typeof document !== 'undefined' && document.hidden);
    syncPaused();
    document.addEventListener('visibilitychange', syncPaused);
    return () => document.removeEventListener('visibilitychange', syncPaused);
  }, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  useEffect(
    () => () => {
      if (outcomeTimerRef.current != null) window.clearTimeout(outcomeTimerRef.current);
      if (speakingTimerRef.current != null) window.clearTimeout(speakingTimerRef.current);
      if (tapTimerRef.current != null) window.clearTimeout(tapTimerRef.current);
      if (holdTimerRef.current != null) window.clearTimeout(holdTimerRef.current);
    },
    [],
  );

  const flashOutcome = (flash: OrbOutcomeFlash) => {
    if (outcomeTimerRef.current != null) window.clearTimeout(outcomeTimerRef.current);
    setOutcomeFlash(flash);
    outcomeTimerRef.current = window.setTimeout(() => {
      setOutcomeFlash(null);
      outcomeTimerRef.current = null;
    }, OUTCOME_FLASH_MS);
  };

  // Opportunity page (and other surfaces) flash Orb via custom event.
  useEffect(() => subscribeOrbOutcomeFlash(flashOutcome), []);

  // AskClient / deep links: ?orbSession=inbox|followups|calendar|capture|opportunity&id=
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const surface = params.get('orbSession');
    if (!surface) return;

    let view: SessionView | null = null;
    if (surface === 'opportunity') {
      const id = params.get('id')?.trim();
      if (id) view = { kind: 'opportunity', id };
    } else {
      view = sessionViewForSurface(surface, params.get('draft') || undefined);
    }
    if (!view) return;

    setSessionView(view);
    const url = new URL(window.location.href);
    url.searchParams.delete('orbSession');
    url.searchParams.delete('draft');
    url.searchParams.delete('id');
    const next = `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams}` : ''}`;
    router.replace(next);
  }, [pathname, router]);

  const enterSpeaking = () => {
    if (speakingTimerRef.current != null) window.clearTimeout(speakingTimerRef.current);
    setInteraction('speaking');
    speakingTimerRef.current = window.setTimeout(() => {
      setInteraction(null);
      speakingTimerRef.current = null;
    }, SPEAKING_MS);
  };

  const openHrefPreferSession = (href: string) => {
    setOpen(false);
    if (resolveChromeFadeClient()) {
      const view = sessionViewFromHref(href);
      if (view) {
        setSessionView(view);
        return;
      }
    }
    router.push(href);
  };

  // One-shot ambient opener on first expand — titles from Brief / Action Center only.
  useEffect(() => {
    if (!open || ambientShownRef.current) return;
    ambientShownRef.current = true;
    setAmbientOpener(buildAmbientOpeningFromSession({ brief, actionCenter }));
  }, [open, brief, actionCenter]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('hidden'));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  const session = useMemo(
    () =>
      deriveOrbSession({
        pathname,
        brief,
        objects,
        actionCenter,
        interaction,
        online,
        entityId,
      }),
    [pathname, brief, objects, actionCenter, interaction, online, entityId],
  );

  const findings = session.findings.filter((f) => !dismissedIds.includes(f.id));
  const viewAllHref =
    session.state === 'timeSensitive' ? '/simplifi/follow-ups' : '/simplifi/inbox';

  const ask = async (question?: string) => {
    const q = (question ?? askInput).trim();
    if (!q) return;
    setInteraction('thinking');
    setAskInput(q);
    try {
      const intent = interpretOrbIntent(q);

      // Session surfaces render as a temporary workspace over the Brief.
      if (isOrbSessionSurface(intent.surface)) {
        const view = sessionViewForSurface(intent.surface, intent.draft);
        if (view) {
          setAskAnswer(intent.reply);
          setAskCitations([]);
          setOpen(false);
          setSessionView(view);
          return;
        }
      }

      const matches = searchOpportunities(intent.query ?? q, objects);
      const soleMatch =
        (intent.surface === 'search' || intent.surface === 'ask') && matches.length === 1
          ? matches[0]
          : null;

      // A single confident match opens a quick-view opportunity workspace.
      if (soleMatch) {
        setAskAnswer(intent.reply);
        setAskCitations([
          { id: soleMatch.id, title: soleMatch.title, href: `/simplifi/opportunity/${soleMatch.id}` },
        ]);
        setOpen(false);
        setSessionView({ kind: 'opportunity', id: soleMatch.id });
        return;
      }

      const href = resolveOrbIntentHref(intent, {
        slug,
        draft: intent.draft,
        query: intent.query,
      });

      if (href) {
        setAskAnswer(intent.reply);
        setAskCitations([]);
        setOpen(false);
        router.push(href);
        return;
      }

      try {
        const res = await fetch('/api/simplifi/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            answer?: string;
            citations?: AskCitation[];
          };
          if (data.answer) {
            setAskAnswer(data.answer);
            setAskCitations(data.citations ?? []);
            pushAskHistory({
              question: q,
              answer: data.answer,
              citations: data.citations ?? [],
            });
            return;
          }
        }
      } catch {
        // keyword fallback
      }

      const detailed = answerConversationalAskDetailed(q, objects, actionCenter);
      setAskAnswer(detailed.answer);
      setAskCitations(detailed.citations);
      pushAskHistory({
        question: q,
        answer: detailed.answer,
        citations: detailed.citations,
      });
    } finally {
      enterSpeaking();
    }
  };

  const startVoice = () => {
    const SR =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SR) {
      setAskAnswer('Voice is not available in this browser. Type instead.');
      setOpen(true);
      return;
    }
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) ask(transcript);
    };
    recognition.onend = () => {
      setInteraction((cur) => (cur === 'listening' ? null : cur));
    };
    recognition.onerror = () => {
      setInteraction((cur) => (cur === 'listening' ? null : cur));
    };
    recognitionRef.current = recognition;
    setInteraction('listening');
    setOpen(true);
    recognition.start();
  };

  const captureCurrentPage = async (note?: string) => {
    if (typeof window === 'undefined') return;
    setCaptureNotice('Saving and analyzing…');
    try {
      const data = await analyzeCaptureUrl({
        url: window.location.href,
        title: document.title,
        notes: note,
      });
      if (!data.ok) throw new Error(data.error || 'Capture failed');
      setCaptureNotice('Saved and analyzed');
      flashOutcome('success');
    } catch {
      setCaptureNotice('Could not save. Double tap for options.');
    }
    window.setTimeout(() => setCaptureNotice(''), 2200);
  };

  const handleOrbClick = () => {
    if (heldRef.current) {
      heldRef.current = false;
      return;
    }
    if (tapTimerRef.current != null) window.clearTimeout(tapTimerRef.current);
    tapTimerRef.current = window.setTimeout(() => {
      tapTimerRef.current = null;
      void captureCurrentPage();
    }, TAP_DELAY_MS);
  };

  const handleOrbDoubleClick = () => {
    if (tapTimerRef.current != null) window.clearTimeout(tapTimerRef.current);
    tapTimerRef.current = null;
    setOpen(true);
  };

  const beginHold = () => {
    heldRef.current = false;
    holdTimerRef.current = window.setTimeout(() => {
      heldRef.current = true;
      startVoice();
    }, HOLD_DELAY_MS);
  };

  const endHold = () => {
    if (holdTimerRef.current != null) window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
  };

  const why = () => {
    if (!session.recommendation) return;
    setAskAnswer(
      explainRecommendation({
        title: session.recommendation.label,
        actionCenter,
        objects,
      }),
    );
    enterSpeaking();
  };

  const state = session.state as OrbVisualState;
  const displayState = (outcomeFlash ?? interaction ?? state) as OrbVisualState;
  const showAmbientGreeting = Boolean(ambientOpener);
  const signalCount = findings.length > 0 ? Math.min(findings.length, 9) : 0;

  const orbVisual = (
    <>
      <span className="global-orb-visual">
        <span className="global-orb-halo" aria-hidden="true" />
        <span className="global-orb-rim" aria-hidden="true" />
        <span className="global-orb-shell" aria-hidden="true" />
        <span className="global-orb-core" aria-hidden="true">
          <span className="global-orb-liquid" />
          <span className="global-orb-filaments">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index} style={{ '--filament': index } as CSSProperties} />
            ))}
          </span>
          <span className="global-orb-plasma" />
        </span>
        {signalCount > 0 && !open ? (
          <span className="global-orb-signal" aria-hidden="true">
            {signalCount}
          </span>
        ) : null}
      </span>
    </>
  );

  return (
    <div className="global-orb-root" data-paused={paused ? 'true' : 'false'}>
      <div className="global-orb-live" aria-live="polite">
        {open
          ? ''
          : outcomeFlash === 'success'
            ? 'SIMPLIFI Orb, action completed'
            : outcomeFlash === 'learning'
              ? 'SIMPLIFI Orb, intelligence updated'
              : outcomeFlash === 'celebration'
                ? 'SIMPLIFI Orb, milestone reached'
                : session.ariaLabel}
      </div>

      {open ? (
        <>
          <button type="button" className="global-orb-scrim" aria-label="Dismiss Orb panel" onClick={() => setOpen(false)} />
          <section
            id={panelId}
            ref={panelRef}
            className="global-orb-panel"
            role="dialog"
            aria-modal="true"
            aria-label="SIMPLIFI intelligence"
          >
            <header className={`global-orb-panel-head${showAmbientGreeting ? ' global-orb-panel-head--ambient-only' : ''}`}>
              <span className="global-orb-panel-mini" aria-hidden="true">
                <span className="global-orb-rim" />
                <span className="global-orb-shell" />
                <span className="global-orb-core">
                  <span className="global-orb-liquid" />
                </span>
              </span>
              <div>
                <span className="global-orb-eyebrow">ORBiE · YOUR QUIET ADVANTAGE</span>
                <h2>Quick actions</h2>
                <p>Choose one and keep moving.</p>
              </div>
              <button ref={closeRef} type="button" className="global-orb-close" onClick={() => setOpen(false)}>
                Close
              </button>
            </header>

            <div className="global-orb-panel-body">
              <div className="global-orb-launchpad" aria-label="Orbie quick actions">
                <button type="button" onClick={() => { setOpen(false); setSessionView({ kind: 'capture', draft: typeof window === 'undefined' ? undefined : window.location.href }); }}>
                  <span aria-hidden="true">＋</span><strong>Save with note</strong><small>Add context before saving</small>
                </button>
                <button type="button" onClick={() => { setOpen(false); void captureCurrentPage('Investigate this page and surface the clearest next step.'); }}>
                  <span aria-hidden="true">✦</span><strong>Investigate</strong><small>Analyze what matters</small>
                </button>
                <button type="button" onClick={() => askInputRef.current?.focus()}>
                  <span aria-hidden="true">⌁</span><strong>Ask Orbie</strong><small>Get one clear answer</small>
                </button>
                <button type="button" onClick={() => { setOpen(false); setSessionView({ kind: 'followups' }); }}>
                  <span aria-hidden="true">◷</span><strong>Remind me</strong><small>Choose when it returns</small>
                </button>
              </div>

              {ambientOpener ? (
                <div className="global-orb-ambient" aria-live="polite">
                  {ambientOpener.split('\n').map((line, i) => (
                    <p key={`ambient-${i}`}>{line}</p>
                  ))}
                  {findings.length > 0 ? (
                    <div className="global-orb-actions" style={{ marginTop: 8, marginBottom: 0 }}>
                      <button
                        type="button"
                        className="primary"
                        onClick={() => {
                          setOpen(false);
                          setSessionView({ kind: 'inbox' });
                        }}
                      >
                        Review them
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {findings.length > 0 ? (
                <ul className="global-orb-findings">
                  {findings.map((f) => (
                    <li key={f.id}>
                      {f.href ? (
                        <Link
                          href={f.href}
                          onClick={(e) => {
                            if (resolveChromeFadeClient()) {
                              const view = sessionViewFromHref(f.href!);
                              if (view) {
                                e.preventDefault();
                                setOpen(false);
                                setSessionView(view);
                                return;
                              }
                            }
                            setOpen(false);
                          }}
                        >
                          <strong>{f.title}</strong>
                          {f.detail ? <span>{f.detail}</span> : null}
                        </Link>
                      ) : (
                        <>
                          <strong>{f.title}</strong>
                          {f.detail ? <span>{f.detail}</span> : null}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="global-orb-answer">Nothing urgent is waiting. Your day is clear.</p>
              )}

              {session.recommendation ? (
                <div className="global-orb-reco">
                  <p>Recommended next step</p>
                  <strong>{session.recommendation.label}</strong>
                  {session.recommendation.why ? <span style={{ color: '#5f6b7a', fontSize: '0.85rem' }}>{session.recommendation.why}</span> : null}
                  <div className="global-orb-actions" style={{ marginTop: 10, marginBottom: 0 }}>
                    <button
                      type="button"
                      className="primary"
                      onClick={() => openHrefPreferSession(session.recommendation!.href)}
                    >
                      Show Me
                    </button>
                    <button type="button" onClick={why}>
                      Explain Why
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (session.recommendation) {
                          setDismissedIds((ids) => [...ids, ...findings.map((f) => f.id)]);
                        }
                      }}
                    >
                      Dismiss
                    </button>
                    <button type="button" onClick={() => openHrefPreferSession(viewAllHref)}>
                      View All
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="global-orb-ask">
                <input
                  ref={askInputRef}
                  value={askInput}
                  onChange={(e) => setAskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') ask();
                  }}
                  placeholder="Ask about your workspace…"
                  aria-label="Ask Simplifi"
                />
                <button type="button" className="ghost" onClick={startVoice}>
                  Speak
                </button>
                <button type="button" onClick={() => ask()} disabled={!askInput.trim()}>
                  Ask
                </button>
              </div>
              {askAnswer ? (
                <div className="global-orb-answer">
                  <AskAnswerBody
                    answer={askAnswer}
                    citations={askCitations}
                    onOpenOpportunity={(id) => {
                      setOpen(false);
                      setSessionView({ kind: 'opportunity', id });
                    }}
                  />
                </div>
              ) : null}
              {!loggedIn ? (
                <p className="global-orb-answer">
                  <Link href={`/simplifi/login?next=${encodeURIComponent(pathname)}`}>Sign in</Link> for a personalized Brief.
                  {slug ? null : null}
                </p>
              ) : null}
            </div>
          </section>
        </>
      ) : null}

      {!open ? (
        <button
          type="button"
          className="global-orb-btn"
          data-state={displayState}
          aria-label={session.ariaLabel}
          aria-controls={panelId}
          aria-expanded="false"
          title="Tap to save · double tap for options · hold to speak"
          onClick={handleOrbClick}
          onDoubleClick={handleOrbDoubleClick}
          onPointerDown={beginHold}
          onPointerUp={endHold}
          onPointerCancel={endHold}
          onPointerLeave={endHold}
        >
          {orbVisual}
        </button>
      ) : (
        <button
          type="button"
          className="global-orb-btn"
          data-state={displayState}
          aria-label="SIMPLIFI Orb expanded"
          aria-controls={panelId}
          aria-expanded="true"
          onClick={() => setOpen(false)}
          style={{ opacity: 0.35 }}
        >
          {orbVisual}
        </button>
      )}

      {captureNotice ? <div className="global-orb-capture-notice" role="status">{captureNotice}</div> : null}

      {sessionView ? (
        <SessionWorkspace
          view={sessionView}
          objects={objects}
          loggedIn={loggedIn}
          onClose={() => setSessionView(null)}
          onOpenOpportunity={(id) => setSessionView({ kind: 'opportunity', id })}
          onBackToInbox={() => setSessionView({ kind: 'inbox' })}
          onOutcomeFlash={flashOutcome}
        />
      ) : null}
    </div>
  );
}
