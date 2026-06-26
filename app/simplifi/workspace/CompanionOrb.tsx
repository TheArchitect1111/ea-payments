'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import type { ActionCenterPayload } from '@/lib/action-center';
import { priorityLevelLabel } from '@/lib/priority-engine';
import type { CaptureApiResponse } from '@/lib/capture-response';
import CaptureProcessingPanel from '@/app/components/CaptureProcessingPanel';
import {
  answerAskSimplifi,
  consumeContextLesson,
  explainRecommendation,
  getTeachMeMode,
  recordCompanionEvent,
  setTeachMeMode,
  shouldOfferRecovery,
  type SimplifiContextLesson,
} from '@/lib/simplifi-guidance-system';

type OrbState = 'silent' | 'aware' | 'active';
type PanelView = 'brief' | 'capture' | 'inbox' | 'ask';

interface BriefPayload {
  greeting: string;
  items: {
    id: string;
    title: string;
    detail: string;
    href?: string;
    kind: 'momentum' | 'deadline' | 'explore' | 'overdue' | 'stale' | 'due-soon';
  }[];
  recommendedNext: { label: string; href: string } | null;
}

interface CompanionOrbProps {
  slug: string | null;
  loggedIn: boolean;
  brief: BriefPayload;
  objects: SimplifiObject[];
  actionCenter: ActionCenterPayload;
}

interface OrbPosition {
  x: number;
  y: number;
}

interface PointerStart {
  id: number;
  x: number;
  y: number;
  orbX: number;
  orbY: number;
  at: number;
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

const STORAGE_KEY = 'ea-simplifi-companion-orb-position';
const LONG_PRESS_MS = 520;
const DOUBLE_TAP_MS = 280;
const DRAG_THRESHOLD = 8;

export default function CompanionOrb({ slug, loggedIn, brief, objects, actionCenter }: CompanionOrbProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PanelView>('brief');
  const [position, setPosition] = useState<OrbPosition>({ x: 18, y: 92 });
  const [dragging, setDragging] = useState(false);
  const [captureText, setCaptureText] = useState('');
  const [captureStatus, setCaptureStatus] = useState('');
  const [captureResult, setCaptureResult] = useState<CaptureApiResponse | null>(null);
  const [listening, setListening] = useState(false);
  const [askInput, setAskInput] = useState('');
  const [askAnswer, setAskAnswer] = useState('');
  const [teachMode, setTeachModeState] = useState(false);
  const [lesson, setLesson] = useState<SimplifiContextLesson | null>(null);
  const pointerRef = useRef<PointerStart | null>(null);
  const longPressRef = useRef<number | null>(null);
  const lastTapRef = useRef(0);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const scope = slug ?? 'simplifi-user';

  const focus = useMemo(() => buildCompanionFocus(brief, objects, actionCenter), [brief, objects, actionCenter]);

  const orbState = useMemo<OrbState>(() => {
    if (focus.urgencyCount > 0) return 'active';
    if (brief.items.some((item) => item.kind === 'overdue' || item.kind === 'due-soon')) return 'active';
    if (objects.some((obj) => obj.priorityLevel === 'critical' || obj.priority === 'High')) return 'active';
    if (brief.items.length > 0 || objects.length > 0) return 'aware';
    return 'silent';
  }, [brief.items, focus.urgencyCount, objects]);

  const topItems = brief.items.slice(0, 5);
  const recentObjects = useMemo(() => {
    const processing = objects.filter((obj) => obj.status === 'analyzing');
    const active = objects.filter((obj) => obj.status !== 'analyzing');
    return [...processing, ...active].slice(0, 6);
  }, [objects]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setPosition(defaultOrbPosition());
        return;
      }
      const parsed = JSON.parse(stored) as Partial<OrbPosition>;
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        setPosition({
          x: clamp(parsed.x, 10, Math.max(10, window.innerWidth - 76)),
          y: clamp(parsed.y, 72, Math.max(72, window.innerHeight - 92)),
        });
      }
    } catch {
      // Ignore invalid local storage; the orb can fall back to its default home.
    }
  }, []);

  useEffect(() => () => {
    if (longPressRef.current) window.clearTimeout(longPressRef.current);
    recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    setTeachModeState(getTeachMeMode(scope));
  }, [scope]);

  useEffect(() => {
    const onResize = () => {
      setPosition((current) => {
        const next = {
          x: clamp(current.x, 10, Math.max(10, window.innerWidth - 76)),
          y: clamp(current.y, 72, Math.max(72, window.innerHeight - 92)),
        };
        persistPosition(next);
        return next;
      });
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    recordCompanionEvent(scope, 'opened');
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, scope]);

  const persistPosition = (next: OrbPosition) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Local storage can be blocked; dragging should still work for this session.
    }
  };

  const openPanel = (nextView: PanelView) => {
    setView(nextView);
    setOpen(true);
  };

  const handleProcessingComplete = useCallback((response: CaptureApiResponse) => {
    setCaptureResult(response);
    setCaptureStatus(response.record?.title ? `Ready: ${response.record.title}` : 'Capture is ready.');
  }, []);

  const handleProcessingError = useCallback((message: string) => {
    setCaptureStatus(message);
  }, []);

  const startVoiceCapture = () => {
    setCaptureStatus('');
    setLesson(consumeContextLesson(scope, 'first-voice-capture'));
    setView('capture');
    setOpen(true);

    const SpeechCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechCtor) {
      setCaptureStatus('Voice capture is not available in this browser. Type a quick note instead.');
      return;
    }

    recognitionRef.current?.stop();
    const recognition = new SpeechCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (transcript) setCaptureText(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setCaptureStatus('Voice capture paused. You can type or try again.');
    };
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const submitCapture = async (mode: 'instant' | 'note') => {
    if (!loggedIn) {
      window.location.href = '/simplifi/login?next=/simplifi/workspace';
      return;
    }

    setCaptureResult(null);
    if (mode === 'instant') setLesson(consumeContextLesson(scope, 'first-browser-capture'));
    if (mode === 'note') setLesson(consumeContextLesson(scope, 'first-note-capture'));
    setCaptureStatus(mode === 'instant' ? 'Capturing the current context...' : 'Sending to Simplifi...');
    try {
      const note = mode === 'instant'
        ? await readInstantContext()
        : captureText.trim();
      const res = await fetch('/api/portal/captures/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: window.location.href,
          notes: note || 'Quick context capture from the Simplifi Companion Orb.',
          async: true,
        }),
      });
      const data = (await res.json()) as CaptureApiResponse;
      if (!res.ok || !data.ok) {
        setCaptureStatus(data.error ?? 'Capture could not be saved.');
        return;
      }
      setCaptureText('');
      recordCompanionEvent(scope, 'captured');
      setCaptureResult(data);
      if (data.processing) {
        setCaptureStatus('Captured. Simplifi is organizing it in the background.');
        openPanel('inbox');
        return;
      }
      setCaptureStatus(data.record?.title ? `Captured: ${data.record.title}` : 'Captured and ready.');
      openPanel('brief');
    } catch {
      setCaptureStatus('Capture could not be saved. Try again.');
    }
  };

  const answerQuestion = (question = askInput) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    recordCompanionEvent(scope, 'asked');
    setAskInput(trimmed);
    setAskAnswer(answerAskSimplifi(trimmed, objects, actionCenter));
  };

  const toggleTeachMode = () => {
    const next = !teachMode;
    setTeachModeState(next);
    setTeachMeMode(scope, next);
    if (next) {
      setAskAnswer('Teach Me is on. I will explain quiet automatic actions when they matter.');
    }
  };

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      orbX: position.x,
      orbY: position.y,
      at: Date.now(),
    };
    setDragging(false);
    if (longPressRef.current) window.clearTimeout(longPressRef.current);
    longPressRef.current = window.setTimeout(() => {
      pointerRef.current = null;
      startVoiceCapture();
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = pointerRef.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (longPressRef.current) window.clearTimeout(longPressRef.current);
    setDragging(true);
    const next = {
      x: clamp(start.orbX + dx, 10, window.innerWidth - 76),
      y: clamp(start.orbY + dy, 72, window.innerHeight - 92),
    };
    setPosition(next);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = pointerRef.current;
    if (longPressRef.current) window.clearTimeout(longPressRef.current);
    pointerRef.current = null;

    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    if (dragging) {
      const next = {
        x: clamp(start.orbX + dx, 10, window.innerWidth - 76),
        y: clamp(start.orbY + dy, 72, window.innerHeight - 92),
      };
      persistPosition(next);
      if (dy < -72) openPanel('inbox');
      if (dy > 72) openPanel('capture');
      setDragging(false);
      return;
    }

    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      void submitCapture('instant');
      return;
    }

    lastTapRef.current = now;
    window.setTimeout(() => {
      if (Date.now() - lastTapRef.current >= DOUBLE_TAP_MS && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
        lastTapRef.current = 0;
        openPanel('brief');
      }
    }, DOUBLE_TAP_MS + 10);
  };

  return (
    <>
      {open ? <div className="companion-scrim" onClick={() => setOpen(false)} aria-hidden="true" /> : null}
      <section
        className={`companion-panel${open ? ' companion-panel-open' : ''}`}
        aria-label="Simplifi companion"
        aria-modal={open}
        role="dialog"
      >
        <header className="companion-panel-head">
          <div>
            <p>{brief.greeting.replace(/\.$/, '')}</p>
            <h2>{panelTitle(view)}</h2>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close companion">
            Close
          </button>
        </header>

        <nav className="companion-tabs" aria-label="Companion views" role="tablist">
          <button
            type="button"
            className={view === 'brief' ? 'active' : ''}
            aria-selected={view === 'brief'}
            role="tab"
            onClick={() => setView('brief')}
          >
            Brief
          </button>
          <button
            type="button"
            className={view === 'capture' ? 'active' : ''}
            aria-selected={view === 'capture'}
            role="tab"
            onClick={() => setView('capture')}
          >
            Capture
          </button>
          <button
            type="button"
            className={view === 'inbox' ? 'active' : ''}
            aria-selected={view === 'inbox'}
            role="tab"
            onClick={() => setView('inbox')}
          >
            Inbox
          </button>
          <button
            type="button"
            className={view === 'ask' ? 'active' : ''}
            aria-selected={view === 'ask'}
            role="tab"
            onClick={() => setView('ask')}
          >
            Ask
          </button>
        </nav>

        {view === 'brief' ? (
          <div className="companion-stack">
            <article className={`companion-focus-card companion-focus-${focus.tone}`}>
              <div>
                <span>{focus.label}</span>
                <strong>{focus.headline}</strong>
                <p>{focus.detail}</p>
              </div>
              <div className="companion-focus-metrics" aria-label="Companion focus signals">
                <span>{focus.urgencyCount} urgent</span>
                <span>{focus.processingCount} processing</span>
              </div>
              {focus.href ? (
                <Link href={focus.href}>{focus.actionLabel}</Link>
              ) : (
                <button type="button" onClick={() => setView('capture')}>
                  {focus.actionLabel}
                </button>
              )}
              <button
                type="button"
                className="companion-why-btn"
                onClick={() => {
                  setAskAnswer(explainRecommendation({ title: focus.headline, actionCenter, objects }));
                  setView('ask');
                }}
              >
                Why?
              </button>
            </article>
            {shouldOfferRecovery(scope, objects) ? (
              <article className="companion-card companion-recovery">
                <strong>Looking for recent captures?</strong>
                <p>I can open the Capture Inbox or explain why something is showing up.</p>
                <button type="button" onClick={() => setView('inbox')}>Open inbox</button>
              </article>
            ) : null}
            {topItems.length === 0 ? (
              <article className="companion-card">
                <strong>Nothing urgent right now</strong>
                <p>Capture something worth remembering and Simplifi will organize the next move.</p>
                <Link href="/simplifi/capture">Capture</Link>
              </article>
            ) : (
              topItems.map((item) => (
                <article key={item.id} className={`companion-card companion-${item.kind}`}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  {item.href ? <Link href={item.href}>Open</Link> : <button type="button" onClick={() => setView('inbox')}>Review</button>}
                </article>
              ))
            )}
          </div>
        ) : null}

        {view === 'capture' ? (
          <div className="companion-capture">
            <p className="companion-hint">
              Drop a loose thought, link, reminder, or follow-up here. Simplifi will turn it into a next move.
            </p>
            {lesson ? (
              <article className="companion-lesson">
                <strong>{lesson.title}</strong>
                <p>{lesson.body}</p>
              </article>
            ) : null}
            {teachMode && !lesson ? (
              <article className="companion-lesson">
                <strong>Quiet learning</strong>
                <p>I will explain what just happened only when it helps you trust the next step.</p>
              </article>
            ) : null}
            <textarea
              value={captureText}
              onChange={(event) => setCaptureText(event.target.value)}
              placeholder="Say or type what you want Simplifi to remember..."
            />
            {captureStatus ? <p className="companion-status" aria-live="polite">{captureStatus}</p> : null}
            {captureResult?.captureId ? (
              <p className="companion-capture-id">Capture {captureResult.captureId} is in motion.</p>
            ) : null}
            <div className="companion-actions">
              <button type="button" onClick={startVoiceCapture}>
                {listening ? 'Listening...' : 'Voice Capture'}
              </button>
              <button type="button" onClick={() => void submitCapture('note')} disabled={!captureText.trim()}>
                Capture Note
              </button>
              <Link href="/simplifi/capture">More Sources</Link>
            </div>
          </div>
        ) : null}

        {view === 'inbox' ? (
          <div className="companion-stack">
            {captureResult?.processing && captureResult.captureId ? (
              <article className="companion-processing-card">
                <CaptureProcessingPanel
                  captureId={captureResult.captureId}
                  title={captureResult.record?.title}
                  autoOpenMagnifi={false}
                  showActiveSave={loggedIn}
                  onComplete={handleProcessingComplete}
                  onError={handleProcessingError}
                />
              </article>
            ) : null}
            {recentObjects.length === 0 ? (
              <article className="companion-card">
                <strong>Inbox is clear</strong>
                <p>New captures will appear here while AI processes and organizes them.</p>
              </article>
            ) : (
              recentObjects.map((obj) => (
                <article key={obj.id} className="companion-card">
                  <strong>{obj.title}</strong>
                  <p>{obj.nextAction}</p>
                  {obj.whyThisMatters ? <p className="companion-object-reason">{obj.whyThisMatters.slice(0, 130)}</p> : null}
                  <div className="companion-object-meta">
                    <span>{obj.status === 'analyzing' ? 'Processing' : obj.priorityLevel ? priorityLevelLabel(obj.priorityLevel) : obj.priority}</span>
                    {obj.dueDate ? <span>Due {obj.dueDate}</span> : null}
                  </div>
                  {obj.considerUrl || obj.shareUrl ? (
                    <Link href={obj.considerUrl ?? obj.shareUrl ?? '/simplifi/workspace'}>Open</Link>
                  ) : null}
                </article>
              ))
            )}
          </div>
        ) : null}

        {view === 'ask' ? (
          <div className="companion-ask">
            <p className="companion-hint">Ask naturally. I will keep it short and help you act.</p>
            <div className="companion-ask-row">
              <input
                value={askInput}
                onChange={(event) => setAskInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') answerQuestion();
                }}
                placeholder="Why am I seeing this?"
              />
              <button type="button" onClick={() => answerQuestion()} disabled={!askInput.trim()}>
                Ask
              </button>
            </div>
            <div className="companion-prompt-grid">
              {['Where did my note go?', 'Why am I seeing this?', "Show today's opportunities"].map((prompt) => (
                <button key={prompt} type="button" onClick={() => answerQuestion(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
            {askAnswer ? <article className="companion-answer">{askAnswer}</article> : null}
            <label className="companion-teach-toggle">
              <input type="checkbox" checked={teachMode} onChange={toggleTeachMode} />
              <span>Teach Me</span>
            </label>
          </div>
        ) : null}
      </section>

      <button
        type="button"
        className={`companion-orb companion-orb-${orbState}${dragging ? ' companion-orb-dragging' : ''}`}
        aria-label="Open Simplifi companion"
        title={orbTitle(orbState)}
        style={{ right: 'auto', bottom: 'auto', transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          if (longPressRef.current) window.clearTimeout(longPressRef.current);
          pointerRef.current = null;
          setDragging(false);
        }}
      >
        <span className="companion-orb-halo" aria-hidden="true" />
        <span className="companion-orb-core" aria-hidden="true" />
      </button>
    </>
  );
}

async function readInstantContext(): Promise<string> {
  const parts = [`Context page: ${window.location.href}`];
  if (document.title) parts.push(`Page title: ${document.title}`);

  try {
    const clipboard = await navigator.clipboard?.readText();
    if (clipboard?.trim()) parts.push(`Clipboard: ${clipboard.trim().slice(0, 1000)}`);
  } catch {
    // Clipboard access is permissioned; current context is enough for instant capture.
  }

  return parts.join('\n');
}

function panelTitle(view: PanelView): string {
  if (view === 'capture') return 'Capture what matters';
  if (view === 'inbox') return 'Capture Inbox';
  return 'Smart Brief';
}

function orbTitle(state: OrbState): string {
  if (state === 'active') return 'Simplifi recommends looking now';
  if (state === 'aware') return 'Simplifi noticed something';
  return 'Simplifi is ready';
}

function buildCompanionFocus(
  brief: BriefPayload,
  objects: SimplifiObject[],
  actionCenter: ActionCenterPayload,
): {
  tone: 'calm' | 'aware' | 'urgent';
  label: string;
  headline: string;
  detail: string;
  actionLabel: string;
  href?: string;
  urgencyCount: number;
  processingCount: number;
} {
  const urgentBriefItems = brief.items.filter((item) => item.kind === 'overdue' || item.kind === 'due-soon');
  const criticalObjects = objects.filter((obj) => obj.priorityLevel === 'critical' || obj.priority === 'High');
  const processingObjects = objects.filter((obj) => obj.status === 'analyzing');
  const urgencyCount = actionCenter.needsAttention.length + urgentBriefItems.length + criticalObjects.length;
  const recommended = actionCenter.needsAttention[0] ?? actionCenter.recommended[0] ?? null;
  const topObject = criticalObjects[0] ?? objects[0] ?? null;

  if (recommended) {
    return {
      tone: urgencyCount > 0 ? 'urgent' : 'aware',
      label: urgencyCount > 0 ? 'Needs attention' : 'Recommended',
      headline: recommended.title,
      detail: recommended.detail,
      actionLabel: 'Open',
      href: recommended.href,
      urgencyCount,
      processingCount: processingObjects.length,
    };
  }

  if (topObject) {
    return {
      tone: topObject.priority === 'High' || topObject.priorityLevel === 'critical' ? 'urgent' : 'aware',
      label: 'Best next move',
      headline: topObject.nextAction,
      detail: topObject.whyThisMatters || topObject.title,
      actionLabel: topObject.considerUrl || topObject.shareUrl ? 'Open' : 'Review inbox',
      href: topObject.considerUrl ?? topObject.shareUrl,
      urgencyCount,
      processingCount: processingObjects.length,
    };
  }

  return {
    tone: 'calm',
    label: 'Workspace clear',
    headline: brief.recommendedNext?.label ?? 'Capture the next useful signal',
    detail: 'Simplifi is ready when something worth remembering shows up.',
    actionLabel: 'Capture',
    href: brief.recommendedNext?.href ?? '/simplifi/capture',
    urgencyCount,
    processingCount: processingObjects.length,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function defaultOrbPosition(): OrbPosition {
  if (typeof window === 'undefined') return { x: 18, y: 92 };
  return {
    x: clamp(window.innerWidth - 86, 10, Math.max(10, window.innerWidth - 76)),
    y: clamp(window.innerHeight - 112, 72, Math.max(72, window.innerHeight - 92)),
  };
}
