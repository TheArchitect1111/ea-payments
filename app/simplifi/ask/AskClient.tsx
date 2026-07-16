'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import type { ActionCenterPayload } from '@/lib/action-center';
import { answerConversationalAsk, searchOpportunities } from '@/lib/simplifi-ask';

const SUGGESTIONS = [
  'What deserves attention today?',
  'What follow-ups are due?',
  "What's fading?",
];

export default function AskClient({
  greeting,
  loggedIn,
  objects,
  actionCenter,
}: {
  greeting: string;
  loggedIn: boolean;
  objects: SimplifiObject[];
  actionCenter: ActionCenterPayload;
}) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [matches, setMatches] = useState<SimplifiObject[]>([]);

  const ask = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuestion(trimmed);
    setAnswer(answerConversationalAsk(trimmed, objects, actionCenter));
    setMatches(searchOpportunities(trimmed, objects).slice(0, 5));
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
          <p style={{ whiteSpace: 'pre-wrap' }}>{answer}</p>
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

      <section className="sw-quick-actions">
        <Link href="/simplifi/workspace">Brief</Link>
        <Link href="/simplifi/inbox">Inbox</Link>
        <Link href="/simplifi/follow-ups">Follow-ups</Link>
      </section>
    </>
  );
}
