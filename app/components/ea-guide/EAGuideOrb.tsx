'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveGuidePageContext } from '@/lib/ea-guide-context';
import { getPageSpecificHint } from '@/lib/ea-guide-knowledge';
import {
  EA_GUIDE_FIRST_LOGIN_KEY,
  EA_GUIDE_GUIDE_ATTEMPT_KEY,
  EA_GUIDE_USER_KEY,
  type EAOrbState,
  type GuideProgress,
  type GuideTour,
} from '@/lib/ea-guide-types';
import {
  getGuideTour,
  getRecommendedTour,
  listToursForPage,
} from '@/lib/ea-guide-tours';
import { resolveGuideContext, type EAGuideAction } from '@/lib/ea-guide';
import TourDriver, { startEAGuideTour } from './TourDriver';
import './ea-guide.css';

type PanelMode = 'home' | 'question' | 'escalation';

function inferFirstName() {
  if (typeof document === 'undefined') return 'there';
  const match = document.cookie.match(/(?:^|;\s*)ea_portal_first=([^;]+)/);
  if (match?.[1]) return decodeURIComponent(match[1]);
  return 'there';
}

function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = window.localStorage.getItem(EA_GUIDE_USER_KEY);
  if (!id) {
    id = `u-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(EA_GUIDE_USER_KEY, id);
  }
  return id;
}

function readLocalProgress(userId: string): GuideProgress[] {
  try {
    const raw = window.localStorage.getItem(`ea-guide-progress-local-${userId}`);
    return raw ? (JSON.parse(raw) as GuideProgress[]) : [];
  } catch {
    return [];
  }
}

function writeLocalProgress(userId: string, rows: GuideProgress[]) {
  window.localStorage.setItem(`ea-guide-progress-local-${userId}`, JSON.stringify(rows));
}

export default function EAGuideOrb() {
  const pathname = usePathname() ?? '/';
  const legacyContext = useMemo(() => resolveGuideContext(pathname), [pathname]);
  const pageContext = useMemo(() => resolveGuidePageContext(pathname), [pathname]);
  const [userId] = useState(() => getOrCreateUserId());
  const [open, setOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>('home');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerLoading, setAnswerLoading] = useState(false);
  const [suggestEscalation, setSuggestEscalation] = useState(false);
  const [toast, setToast] = useState('');
  const [activeTour, setActiveTour] = useState<GuideTour | null>(null);
  const [progress, setProgress] = useState<GuideProgress[]>(() => readLocalProgress(getOrCreateUserId()));
  const [guideAttempted, setGuideAttempted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(EA_GUIDE_GUIDE_ATTEMPT_KEY) === 'true';
  });
  const [escalationSummary, setEscalationSummary] = useState('');
  const [escalationDetails, setEscalationDetails] = useState('');
  const [firstLoginComplete, setFirstLoginComplete] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(EA_GUIDE_FIRST_LOGIN_KEY) === 'true';
  });
  const [firstName] = useState(() => inferFirstName());

  const completedTourIds = useMemo(
    () => progress.filter((row) => row.completedAt).map((row) => row.tourId),
    [progress],
  );

  const availableTours = useMemo(
    () => listToursForPage(pathname, pageContext.portalType, pageContext.role),
    [pathname, pageContext.portalType, pageContext.role],
  );

  const recommendedTour = useMemo(
    () => getRecommendedTour(pathname, pageContext.portalType, pageContext.role, completedTourIds),
    [pathname, pageContext.portalType, pageContext.role, completedTourIds],
  );

  const pageHint = useMemo(() => getPageSpecificHint({ ...pageContext, userId }), [pageContext, userId]);

  function markGuideAttempted() {
    setGuideAttempted(true);
    window.localStorage.setItem(EA_GUIDE_GUIDE_ATTEMPT_KEY, 'true');
  }

  useEffect(() => {
    if (firstLoginComplete) return undefined;
    const timer = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(timer);
  }, [firstLoginComplete]);

  useEffect(() => {
    async function syncProgress() {
      try {
        const res = await fetch(`/api/ea-guide/progress?userId=${encodeURIComponent(userId)}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const payload = (await res.json()) as { progress?: GuideProgress[] };
        if (payload.progress?.length) {
          setProgress(payload.progress);
          writeLocalProgress(userId, payload.progress);
        }
      } catch {
        /* local progress is enough offline */
      }
    }
    syncProgress();
  }, [userId]);

  useEffect(() => {
    function onStartTour(event: Event) {
      const tourId = (event as CustomEvent<{ tourId: string }>).detail?.tourId;
      if (!tourId) return;
      const tour = getGuideTour(tourId);
      if (tour) {
        setActiveTour(tour);
        setOpen(false);
        markGuideAttempted();
      }
    }
    window.addEventListener('ea-guide:start-tour', onStartTour);
    return () => window.removeEventListener('ea-guide:start-tour', onStartTour);
  }, []);

  const persistProgress = useCallback(
    async (entry: GuideProgress) => {
      setProgress((rows) => {
        const next = rows.filter((row) => row.tourId !== entry.tourId);
        next.push(entry);
        writeLocalProgress(userId, next);
        return next;
      });
      try {
        await fetch('/api/ea-guide/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
      } catch {
        /* local copy retained */
      }
    },
    [userId],
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  }, []);

  const startTour = useCallback((tour: GuideTour) => {
    markGuideAttempted();
    setActiveTour(tour);
    setOpen(false);
    setPanelMode('home');
  }, []);

  const completeFirstLogin = useCallback(
    (startOrientation = false) => {
      window.localStorage.setItem(EA_GUIDE_FIRST_LOGIN_KEY, 'true');
      setFirstLoginComplete(true);
      if (startOrientation) {
        const tour = getGuideTour('first-login-orientation');
        if (tour) startTour(tour);
      }
    },
    [startTour],
  );

  const askQuestion = useCallback(async () => {
    const q = question.trim();
    if (!q) return;
    setAnswerLoading(true);
    setPanelMode('question');
    markGuideAttempted();
    try {
      const res = await fetch('/api/ea-guide/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          pathname,
          userId,
          organizationId: pageContext.organizationId,
        }),
      });
      const payload = (await res.json()) as {
        answer?: string;
        suggestEscalation?: boolean;
        nextSteps?: string[];
      };
      const base = payload.answer ?? 'I could not find an answer. Try Walk me through this page.';
      const steps = payload.nextSteps?.length ? `\n\nNext: ${payload.nextSteps.join(' · ')}` : '';
      setAnswer(base + steps);
      setSuggestEscalation(Boolean(payload.suggestEscalation));
    } catch {
      setAnswer('Something went wrong. Try Walk me through this page, or contact the EA team.');
      setSuggestEscalation(true);
    } finally {
      setAnswerLoading(false);
    }
  }, [question, pathname, userId, pageContext.organizationId]);

  const submitEscalation = useCallback(async () => {
    const summary = escalationSummary.trim() || question.trim();
    if (!summary) {
      showToast('Describe the issue first.');
      return;
    }
    try {
      const res = await fetch('/api/ea-guide/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: pathname,
          portalType: pageContext.portalType,
          role: pageContext.role,
          organizationId: pageContext.organizationId,
          userId,
          workflow: pageContext.workflow,
          issueSummary: summary,
          details: escalationDetails.trim() || answer,
        }),
      });
      const payload = (await res.json()) as { message?: string };
      showToast(payload.message ?? "Sent to the EA team.");
      setPanelMode('home');
      setEscalationSummary('');
      setEscalationDetails('');
      setOpen(false);
    } catch {
      showToast('Could not send. Try again in a moment.');
    }
  }, [
    escalationSummary,
    escalationDetails,
    question,
    pathname,
    pageContext,
    userId,
    answer,
    showToast,
  ]);

  const orbState: EAOrbState = activeTour
    ? 'walkthrough'
    : panelMode === 'escalation'
      ? 'escalation'
      : panelMode === 'question'
        ? 'question'
        : !firstLoginComplete
          ? 'new-user'
          : recommendedTour
            ? 'tour-available'
            : legacyContext.state === 'alert' || legacyContext.state === 'warning'
              ? 'needs-action'
              : 'idle';

  const recommendedAction = recommendedTour?.title ?? legacyContext.recommendedAction;
  const recommendationDetail = recommendedTour?.description ?? legacyContext.recommendationDetail;

  const guideActions: EAGuideAction[] = legacyContext.actions;

  const stacked = pathname.includes('/simplifi/capture') || pathname.includes('/amplifi/share');

  return (
    <>
      <div className={`ea-guide-shell${stacked ? ' ea-guide-shell-stacked' : ''}`}>
        {toast ? <div className="ea-guide-toast">{toast}</div> : null}

        {open ? (
          <section className="ea-guide-card" aria-label="EA Guide">
            <div className="ea-guide-card-head">
              <div>
                <p className="ea-guide-eyebrow">EA Guide&trade;</p>
                <h2>
                  {!firstLoginComplete
                    ? 'Welcome'
                    : panelMode === 'escalation'
                      ? 'Contact EA team'
                      : `Hi ${firstName}`}
                </h2>
                <p className="ea-guide-context-line">{pageContext.label}</p>
              </div>
              <button
                type="button"
                className="ea-guide-icon-btn"
                onClick={() => {
                  setOpen(false);
                  setPanelMode('home');
                }}
                aria-label="Close EA Guide"
              >
                x
              </button>
            </div>

            {!firstLoginComplete ? (
              <>
                <p className="ea-guide-welcome-copy">
                  Welcome. I can walk you through your portal. Let&apos;s start with what matters most today.
                </p>
                <div className="ea-guide-actions">
                  <button
                    type="button"
                    className="ea-guide-action"
                    onClick={() => completeFirstLogin(true)}
                  >
                    Walk me through my portal
                  </button>
                  <button
                    type="button"
                    className="ea-guide-action ea-guide-action-muted"
                    onClick={() => completeFirstLogin(false)}
                  >
                    Explore on my own
                  </button>
                </div>
              </>
            ) : panelMode === 'escalation' ? (
              <>
                <p className="ea-guide-muted">
                  I&apos;ll send this to the EA team with your page, role, and workflow context. No help desk email required.
                </p>
                <label className="ea-guide-field">
                  <span>What do you need help with?</span>
                  <textarea
                    value={escalationSummary}
                    onChange={(e) => setEscalationSummary(e.target.value)}
                    rows={3}
                    placeholder="Brief summary of the issue"
                  />
                </label>
                <label className="ea-guide-field">
                  <span>Additional details (optional)</span>
                  <textarea
                    value={escalationDetails}
                    onChange={(e) => setEscalationDetails(e.target.value)}
                    rows={2}
                    placeholder="Steps you tried, what you expected"
                  />
                </label>
                <div className="ea-guide-actions">
                  <button type="button" className="ea-guide-action" onClick={submitEscalation}>
                    Send to EA team
                  </button>
                  <button
                    type="button"
                    className="ea-guide-action ea-guide-action-muted"
                    onClick={() => setPanelMode('home')}
                  >
                    Back
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="ea-guide-page-hint">{pageHint}</p>

                <div className="ea-guide-ask">
                  <p className="ea-guide-section-label">Ask a question</p>
                  <div className="ea-guide-ask-row">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Uploads, payments, next step..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') askQuestion();
                      }}
                    />
                    <button type="button" className="ea-guide-ask-btn" onClick={askQuestion} disabled={answerLoading}>
                      {answerLoading ? '...' : 'Ask'}
                    </button>
                  </div>
                  {answer ? <p className="ea-guide-answer">{answer}</p> : null}
                </div>

                <div className="ea-guide-recommendation">
                  <p className="ea-guide-section-label">Recommended next step</p>
                  <strong>{recommendedAction}</strong>
                  <span>{recommendationDetail}</span>
                  {recommendedTour ? (
                    <button
                      type="button"
                      className="ea-guide-inline-btn"
                      onClick={() => startTour(recommendedTour)}
                    >
                      Start recommended guide
                    </button>
                  ) : null}
                </div>

                <div className="ea-guide-actions">
                  <button
                    type="button"
                    className="ea-guide-action"
                    onClick={() => {
                      const tour =
                        availableTours.find((t) => t.tourId !== 'first-login-orientation') ?? recommendedTour;
                      if (tour) startTour(tour);
                      else showToast('No walkthrough for this page yet.');
                    }}
                  >
                    Walk me through this page
                  </button>
                  {guideActions.slice(0, 2).map((action) =>
                    action.kind === 'href' && action.href ? (
                      <Link
                        key={action.id}
                        href={action.href}
                        className="ea-guide-action ea-guide-action-muted"
                        onClick={() => setOpen(false)}
                      >
                        {action.label}
                      </Link>
                    ) : null,
                  )}
                </div>

                {availableTours.length > 0 ? (
                  <div className="ea-guide-tour-list">
                    <p className="ea-guide-section-label">Available guides</p>
                    <ul>
                      {availableTours.map((tour) => {
                        const done = completedTourIds.includes(tour.tourId);
                        return (
                          <li key={tour.tourId}>
                            <button type="button" onClick={() => startTour(tour)}>
                              {tour.title}
                              {done ? ' ✓' : ''}
                            </button>
                            {tour.estimatedMinutes ? (
                              <span>{tour.estimatedMinutes} min</span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}

                {(guideAttempted || suggestEscalation) ? (
                  <div className="ea-guide-escalate">
                    <p className="ea-guide-section-label">Still need help?</p>
                    <button
                      type="button"
                      className="ea-guide-action ea-guide-action-muted"
                      onClick={() => setPanelMode('escalation')}
                    >
                      Contact EA team
                    </button>
                  </div>
                ) : (
                  <p className="ea-guide-muted ea-guide-escalate-hint">
                    Try a guide or ask a question first. Contact EA team appears after that.
                  </p>
                )}
              </>
            )}
          </section>
        ) : null}

        <button
          type="button"
          className={`ea-guide-orb ea-guide-orb-${orbState}`}
          aria-label="Open EA Guide"
          data-state={orbState}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="ea-guide-ring ea-guide-ring-gold" />
          <span className="ea-guide-ring ea-guide-ring-blue" />
          <span className="ea-guide-core">
            <Image src="/ea-logo.png" alt="" width={28} height={28} className="ea-guide-logo" />
          </span>
          <span className="ea-guide-state">{orbState.replace('-', ' ')}</span>
          {!open && recommendedTour && !completedTourIds.includes(recommendedTour.tourId) ? (
            <span className="ea-guide-badge">Guide available</span>
          ) : null}
        </button>
      </div>

      {activeTour ? (
        <TourDriver
          key={activeTour.tourId}
          tour={activeTour}
          open
          onClose={({ completed, lastStepIndex }) => {
            const now = new Date().toISOString();
            persistProgress({
              userId,
              organizationId: pageContext.organizationId,
              tourId: activeTour.tourId,
              completedAt: completed ? now : undefined,
              skippedAt: completed ? undefined : now,
              lastStepIndex,
            });
            if (activeTour.tourId === 'first-login-orientation' && completed) {
              window.localStorage.setItem(EA_GUIDE_FIRST_LOGIN_KEY, 'true');
              setFirstLoginComplete(true);
            }
            setActiveTour(null);
            showToast(completed ? 'Guide complete.' : 'Guide skipped.');
          }}
        />
      ) : null}
    </>
  );
}

export { startEAGuideTour };
