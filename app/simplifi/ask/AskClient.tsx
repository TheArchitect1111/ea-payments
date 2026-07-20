'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import type { ActionCenterPayload } from '@/lib/action-center';
import { interpretOrbIntent, isOrbSessionSurface, resolveOrbIntentHref } from '@/lib/orb-os';
import {
  answerConversationalAskDetailed,
  searchOpportunities,
  type AskCitation,
} from '@/lib/simplifi-ask';
import {
  clearAskHistory,
  loadAskHistory,
  pushAskHistory,
  type AskHistoryItem,
} from '@/lib/simplifi/ask-session-history';
import AskAnswerBody from '../components/AskAnswerBody';

const SUGGESTIONS = [
  'What deserves attention today?',
  'What follow-ups are due?',
  "What's fading?",
  'Show my inbox',
  'Open capture',
];

export default function AskClient({
  greeting,
  loggedIn,
  objects,
  actionCenter,
  slug,
}: {
  greeting: string;
  loggedIn: boolean;
  objects: SimplifiObject[];
  actionCenter: ActionCenterPayload;
  slug?: string | null;
}) {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState<AskCitation[]>([]);
  const [matches, setMatches] = useState<SimplifiObject[]>([]);
  const [history, setHistory] = useState<AskHistoryItem[]>([]);

  useEffect(() => {
    setHistory(loadAskHistory());
  }, []);

  const ask = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuestion(trimmed);

    const intent = interpretOrbIntent(trimmed);
    const hits = searchOpportunities(intent.query ?? trimmed, objects);
    const soleMatch =
      (intent.surface === 'search' || intent.surface === 'ask') && hits.length === 1 ? hits[0] : null;

    if (soleMatch) {
      setAnswer(intent.reply);
      setCitations([
        {
          id: soleMatch.id,
          title: soleMatch.title,
          href: `/simplifi/opportunity/${soleMatch.id}`,
        },
      ]);
      setMatches([]);
      router.push(
        `/simplifi/workspace?orbSession=opportunity&id=${encodeURIComponent(soleMatch.id)}`,
      );
      return;
    }

    if (isOrbSessionSurface(intent.surface)) {
      const params = new URLSearchParams({ orbSession: intent.surface });
      if (intent.draft) params.set('draft', intent.draft.slice(0, 2000));
      setAnswer(intent.reply);
      setCitations([]);
      setMatches([]);
      router.push(`/simplifi/workspace?${params}`);
      return;
    }

    const href = resolveOrbIntentHref(intent, {
      slug,
      draft: intent.draft,
      query: intent.query,
    });

    if (href) {
      setAnswer(intent.reply);
      setCitations([]);
      setMatches([]);
      router.push(href);
      return;
    }

    const detailed = answerConversationalAskDetailed(trimmed, objects, actionCenter);
    setAnswer(detailed.answer);
    setCitations(detailed.citations);
    setMatches(hits.slice(0, 5));
    setHistory(
      pushAskHistory({
        question: trimmed,
        answer: detailed.answer,
        citations: detailed.citations,
      }),
    );
  };

  return (
    <>
      <section className="sw-brief-intro">
        <p>{greeting.replace(/\.$/, '')}</p>
        <h1>Ask Simplifi</h1>
        <p className="sw-muted">Ask what changed, what matters, or search your opportunities.</p>
      </section>

      {!loggedIn ? (
        <p className="sw-muted">
          <Link href="/simplifi/login?next=/simplifi/ask">Sign in</Link> so answers use your workspace.
        </p>
      ) : null}

      <label className="sw-search">
        <span>Your question</span>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What follow-ups are due this week?"
          onKeyDown={(e) => {
            if (e.key === 'Enter') ask(question);
          }}
        />
      </label>

      <div className="sw-quick-actions" aria-label="Suggested questions">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => ask(s)}>
            {s}
          </button>
        ))}
        <button type="button" onClick={() => ask(question)} disabled={!question.trim()}>
          Ask
        </button>
      </div>

      {answer ? (
        <article className="sw-brief-panel">
          <h2>Answer</h2>
          <AskAnswerBody answer={answer} citations={citations} />
        </article>
      ) : null}

      {matches.length > 0 ? (
        <section className="sw-brief-panel">
          <div className="sw-panel-heading">
            <h2>Related opportunities</h2>
            <span>{matches.length}</span>
          </div>
          <ul className="sw-event-list">
            {matches.map((obj) => (
              <li key={obj.id}>
                <div>
                  <strong>
                    <Link href={`/simplifi/opportunity/${obj.id}`}>{obj.title}</Link>
                  </strong>
                  <p>{obj.nextAction}</p>
                </div>
                <span>{obj.priority}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {history.length > 0 ? (
        <section className="sw-brief-panel">
          <div className="sw-panel-heading">
            <h2>This session</h2>
            <button
              type="button"
              className="sw-btn sw-btn-small sw-btn-ghost"
              onClick={() => {
                clearAskHistory();
                setHistory([]);
              }}
            >
              Clear
            </button>
          </div>
          <ul className="sw-event-list">
            {history.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.question}</strong>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{item.answer}</p>
                  {item.citations[0] ? (
                    <p>
                      <Link href={item.citations[0].href}>
                        Open this opportunity — {item.citations[0].title}
                      </Link>
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="sw-quick-actions">
        <Link href="/simplifi/workspace">Brief</Link>
        <Link href="/simplifi/inbox">Inbox</Link>
        <Link href="/simplifi/follow-ups">Follow-ups</Link>
      </section>
    </>
  );
}
