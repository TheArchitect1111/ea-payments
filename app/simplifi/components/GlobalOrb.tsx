'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ActionCenterPayload } from '@/lib/action-center';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import {
  deriveOrbSession,
  type OrbBriefSlice,
  type OrbVisualState,
} from '@/lib/orb';
import { answerConversationalAsk } from '@/lib/simplifi-ask';
import { explainRecommendation } from '@/lib/simplifi-guidance-system';
import './global-orb.css';

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
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [interaction, setInteraction] = useState<'listening' | 'thinking' | 'speaking' | null>(null);
  const [askInput, setAskInput] = useState('');
  const [askAnswer, setAskAnswer] = useState('');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => () => recognitionRef.current?.stop(), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
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

  const ask = (question?: string) => {
    const q = (question ?? askInput).trim();
    if (!q) return;
    setInteraction('thinking');
    setAskInput(q);
    try {
      setAskAnswer(answerConversationalAsk(q, objects, actionCenter));
    } finally {
      window.setTimeout(() => setInteraction(null), 400);
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
    recognition.onend = () => setInteraction(null);
    recognition.onerror = () => setInteraction(null);
    recognitionRef.current = recognition;
    setInteraction('listening');
    setOpen(true);
    recognition.start();
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
  };

  const state = session.state as OrbVisualState;

  return (
    <div className="global-orb-root">
      <div className="global-orb-live" aria-live="polite">
        {open ? '' : session.ariaLabel}
      </div>

      {open ? (
        <>
          <button type="button" className="global-orb-scrim" aria-label="Dismiss Orb panel" onClick={() => setOpen(false)} />
          <section className="global-orb-panel" role="dialog" aria-modal="true" aria-label="SIMPLIFI intelligence">
            <header className="global-orb-panel-head">
              <span className="global-orb-panel-mini" aria-hidden="true">
                <span className="global-orb-shell" />
                <span className="global-orb-core" />
              </span>
              <div>
                <h2>{session.title}</h2>
                <p>{session.summary}</p>
              </div>
              <button ref={closeRef} type="button" className="global-orb-close" onClick={() => setOpen(false)}>
                Close
              </button>
            </header>

            <div className="global-orb-panel-body">
              {findings.length > 0 ? (
                <ul className="global-orb-findings">
                  {findings.map((f) => (
                    <li key={f.id}>
                      <strong>{f.title}</strong>
                      {f.detail ? <span>{f.detail}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="global-orb-answer">Nothing urgent is waiting. I’m ready when you need me.</p>
              )}

              {session.recommendation ? (
                <div className="global-orb-reco">
                  <p>Recommended next step</p>
                  <strong>{session.recommendation.label}</strong>
                  {session.recommendation.why ? <span style={{ color: '#5f6b7a', fontSize: '0.85rem' }}>{session.recommendation.why}</span> : null}
                  <div className="global-orb-actions" style={{ marginTop: 10, marginBottom: 0 }}>
                    <Link className="primary" href={session.recommendation.href} onClick={() => setOpen(false)}>
                      Show Me
                    </Link>
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
                    <Link href="/simplifi/inbox" onClick={() => setOpen(false)}>
                      View All
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="global-orb-ask">
                <input
                  value={askInput}
                  onChange={(e) => setAskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') ask();
                  }}
                  placeholder="Ask anything…"
                  aria-label="Ask Simplifi"
                />
                <button type="button" className="ghost" onClick={startVoice}>
                  Speak
                </button>
                <button type="button" onClick={() => ask()} disabled={!askInput.trim()}>
                  Ask
                </button>
              </div>
              {askAnswer ? <p className="global-orb-answer">{askAnswer}</p> : null}
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
          data-state={state}
          aria-label={session.ariaLabel}
          title={session.ariaLabel}
          onClick={() => setOpen(true)}
        >
          <span className="global-orb-visual">
            <span className="global-orb-halo" aria-hidden="true" />
            <span className="global-orb-shell" aria-hidden="true" />
            <span className="global-orb-core" aria-hidden="true" />
          </span>
        </button>
      ) : (
        <button
          type="button"
          className="global-orb-btn"
          data-state={interaction ?? state}
          aria-label="SIMPLIFI Orb expanded"
          aria-expanded="true"
          onClick={() => setOpen(false)}
          style={{ opacity: 0.35 }}
        >
          <span className="global-orb-visual">
            <span className="global-orb-halo" aria-hidden="true" />
            <span className="global-orb-shell" aria-hidden="true" />
            <span className="global-orb-core" aria-hidden="true" />
          </span>
        </button>
      )}
    </div>
  );
}
