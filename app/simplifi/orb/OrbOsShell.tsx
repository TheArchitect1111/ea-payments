'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import type { ActionCenterPayload } from '@/lib/action-center';
import { answerConversationalAsk, searchOpportunities } from '@/lib/simplifi-ask';
import {
  buildAmbientOpening,
  interpretOrbIntent,
  writeOrbOsPreviewPreference,
  type OrbSurface,
} from '@/lib/orb-os';
import { analyzeCaptureUrl } from '@/lib/simplifi-client';
import './orb-os.css';

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

interface BriefPayload {
  greeting: string;
  items: {
    id: string;
    title: string;
    detail: string;
    href?: string;
    kind: string;
  }[];
  recommendedNext: { label: string; href: string } | null;
}

export default function OrbOsShell({
  slug,
  loggedIn,
  firstName,
  brief,
  objects,
  actionCenter,
}: {
  slug: string | null;
  loggedIn: boolean;
  firstName: string;
  brief: BriefPayload;
  objects: SimplifiObject[];
  actionCenter: ActionCenterPayload;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [orbReply, setOrbReply] = useState('');
  const [surface, setSurface] = useState<OrbSurface>('home');
  const [searchHits, setSearchHits] = useState<SimplifiObject[]>([]);
  const [askAnswer, setAskAnswer] = useState('');
  const [captureDraft, setCaptureDraft] = useState('');
  const [captureStatus, setCaptureStatus] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const displayName = firstName || brief.greeting.match(/,\s*([^.]+)/)?.[1]?.trim() || '';
  const greetingLine = displayName ? `Good morning, ${displayName}` : brief.greeting.replace(/\.$/, '');

  const ambient = useMemo(
    () =>
      buildAmbientOpening({
        greeting: brief.greeting,
        attentionTitles: [
          ...actionCenter.needsAttention.map((i) => i.title),
          ...brief.items.map((i) => i.title),
        ].filter(Boolean),
      }),
    [actionCenter.needsAttention, brief.greeting, brief.items],
  );

  useEffect(() => {
    setOrbReply(ambient);
    inputRef.current?.focus();
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('orb') === '1') {
      writeOrbOsPreviewPreference(true);
      void fetch('/api/simplifi/orb-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      }).catch(() => undefined);
    }
  }, [ambient]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const exitPreview = async () => {
    writeOrbOsPreviewPreference(false);
    await fetch('/api/simplifi/orb-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    }).catch(() => undefined);
    router.push('/simplifi/workspace');
  };

  const runCapture = async (text: string) => {
    setCaptureStatus('Capturing…');
    try {
      const looksLikeUrl = /^https?:\/\//i.test(text.trim());
      if (looksLikeUrl) {
        const data = await analyzeCaptureUrl({ url: text.trim() });
        if (!data.ok) {
          setCaptureStatus(data.error ?? 'Could not capture.');
          return;
        }
        setCaptureStatus(data.record?.title ? `Captured: ${data.record.title}` : 'Captured.');
        return;
      }
      const res = await fetch('/api/portal/captures/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: text,
          title: text.slice(0, 80),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; record?: { title?: string } };
      if (!res.ok || !data.ok) {
        setCaptureStatus(data.error ?? 'Could not capture.');
        return;
      }
      setCaptureStatus(data.record?.title ? `Captured: ${data.record.title}` : 'Captured.');
    } catch {
      setCaptureStatus('Capture could not be saved.');
    }
  };

  const handleIntent = async (utterance: string) => {
    const intent = interpretOrbIntent(utterance);
    setOrbReply(intent.reply);
    setSurface(intent.surface);
    setSearchHits([]);
    setAskAnswer('');
    setCaptureStatus('');

    if (intent.surface === 'classic') {
      await exitPreview();
      return;
    }
    if (intent.surface === 'settings') {
      router.push('/simplifi/settings');
      return;
    }
    if (intent.surface === 'portal') {
      if (slug) router.push(`/portal/${slug}`);
      else router.push('/portal/login?next=/simplifi/orb');
      return;
    }
    if (intent.surface === 'followups') {
      router.push('/simplifi/follow-ups');
      return;
    }
    if (intent.surface === 'calendar') {
      router.push('/simplifi/calendar');
      return;
    }
    if (intent.surface === 'capture') {
      setCaptureDraft(intent.draft ?? '');
      if (intent.draft) void runCapture(intent.draft);
      return;
    }
    if (intent.surface === 'search' && intent.query) {
      setSearchHits(searchOpportunities(intent.query, objects).slice(0, 8));
      return;
    }
    if (intent.surface === 'ask' && intent.query) {
      setAskAnswer(answerConversationalAsk(intent.query, objects, actionCenter));
      setSearchHits(searchOpportunities(intent.query, objects).slice(0, 5));
    }
  };

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    void handleIntent(text);
  };

  const startVoice = () => {
    const SR =
      typeof window !== 'undefined'
        ? (window as unknown as {
            SpeechRecognition?: new () => SpeechRecognitionLike;
            webkitSpeechRecognition?: new () => SpeechRecognitionLike;
          }).SpeechRecognition ||
          (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
            .webkitSpeechRecognition
        : undefined;
    if (!SR) {
      setOrbReply('Voice is not available in this browser. Type instead.');
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) void handleIntent(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const briefItems = brief.items.slice(0, 5);
  const inboxItems = objects.slice(0, 8);

  return (
    <div className="orb-os">
      <header className="orb-os-escape">
        <button type="button" onClick={() => void exitPreview()}>
          Classic Simplifi
        </button>
        {!loggedIn ? (
          <Link href="/simplifi/login?next=/simplifi/orb">Sign in</Link>
        ) : (
          <span className="orb-os-muted">{slug}</span>
        )}
      </header>

      <main className="orb-os-stage">
        <p className="orb-os-greeting">{greetingLine}</p>

        <div className={`orb-os-presence${listening ? ' orb-os-listening' : ''}`} aria-hidden="true">
          <span className="orb-os-halo" />
          <span className="orb-os-core" />
        </div>
        <p className="orb-os-wordmark">ORB</p>
        <p className="orb-os-prompt">How can I help today?</p>

        {orbReply ? (
          <article className="orb-os-reply" aria-live="polite">
            {orbReply.split('\n').map((line) => (
              <p key={line}>{line}</p>
            ))}
          </article>
        ) : null}

        <form
          className="orb-os-composer"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or speak..."
            aria-label="Talk to Orb"
            autoComplete="off"
          />
          <button type="button" className="orb-os-voice" onClick={startVoice} aria-label="Speak">
            {listening ? '…' : 'Speak'}
          </button>
          <button type="submit" disabled={!input.trim()}>
            Send
          </button>
        </form>

        {surface === 'brief' ? (
          <section className="orb-os-workspace" aria-label="Today's Brief">
            <h2>Today&apos;s Brief</h2>
            {briefItems.length === 0 ? (
              <p className="orb-os-muted">Nothing urgent. Capture something when you are ready.</p>
            ) : (
              <ul>
                {briefItems.map((item) => (
                  <li key={item.id}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    {item.href ? <Link href={item.href}>Open</Link> : null}
                  </li>
                ))}
              </ul>
            )}
            {brief.recommendedNext ? (
              <p className="orb-os-next">
                Next: <Link href={brief.recommendedNext.href}>{brief.recommendedNext.label}</Link>
              </p>
            ) : null}
          </section>
        ) : null}

        {surface === 'inbox' ? (
          <section className="orb-os-workspace" aria-label="Opportunities">
            <h2>Opportunities</h2>
            {inboxItems.length === 0 ? (
              <p className="orb-os-muted">Inbox is clear.</p>
            ) : (
              <ul>
                {inboxItems.map((obj) => (
                  <li key={obj.id}>
                    <strong>
                      <Link href={`/simplifi/opportunity/${obj.id}`}>{obj.title}</Link>
                    </strong>
                    <p>{obj.nextAction}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/simplifi/inbox" className="orb-os-link">
              Full inbox
            </Link>
          </section>
        ) : null}

        {surface === 'capture' ? (
          <section className="orb-os-workspace" aria-label="Capture">
            <h2>Capture</h2>
            <textarea
              value={captureDraft}
              onChange={(e) => setCaptureDraft(e.target.value)}
              placeholder="Link, note, or idea…"
              rows={3}
            />
            <div className="orb-os-row">
              <button
                type="button"
                disabled={!captureDraft.trim()}
                onClick={() => void runCapture(captureDraft)}
              >
                Capture now
              </button>
              <Link href="/simplifi/capture">More sources</Link>
            </div>
            {captureStatus ? <p className="orb-os-status">{captureStatus}</p> : null}
          </section>
        ) : null}

        {(surface === 'search' || surface === 'ask') && (askAnswer || searchHits.length > 0) ? (
          <section className="orb-os-workspace" aria-label="Orb answer">
            {askAnswer ? <p className="orb-os-answer">{askAnswer}</p> : null}
            {searchHits.length > 0 ? (
              <ul>
                {searchHits.map((obj) => (
                  <li key={obj.id}>
                    <strong>
                      <Link href={`/simplifi/opportunity/${obj.id}`}>{obj.title}</Link>
                    </strong>
                    <p>{obj.nextAction}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
