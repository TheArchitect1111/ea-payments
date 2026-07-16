'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import type { ActionCenterPayload } from '@/lib/action-center';
import { interpretOrbIntent, resolveOrbIntentHref } from '@/lib/orb-os';
import { answerConversationalAsk, searchOpportunities } from '@/lib/simplifi-ask';

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
  const [matches, setMatches] = useState<SimplifiObject[]>([]);

  const ask = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuestion(trimmed);

    const intent = interpretOrbIntent(trimmed);
    const hits = searchOpportunities(intent.query ?? trimmed, objects);
    const soleMatch =
      (intent.surface === 'search' || intent.surface === 'ask') && hits.length === 1 ? hits[0] : null;
    const href = resolveOrbIntentHref(intent, {
      slug,
      draft: intent.draft,
      query: intent.query,
      opportunityId: soleMatch?.id,
    });

    if (href) {
      setAnswer(intent.reply);
      setMatches([]);
      router.push(href);
      return;
    }

    setAnswer(answerConversationalAsk(trimmed, objects, actionCenter));
    setMatches(hits.slice(0, 5));
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
