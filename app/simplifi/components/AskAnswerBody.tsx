'use client';

import Link from 'next/link';
import type { AskCitation } from '@/lib/simplifi-ask';

const OPP_PATH = /\/simplifi\/opportunity\/[A-Za-z0-9_-]+/g;

function linkifyAnswer(text: string) {
  const parts: Array<string | { href: string }> = [];
  let last = 0;
  for (const match of text.matchAll(OPP_PATH)) {
    const href = match[0];
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    parts.push({ href });
    last = index + href.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  if (parts.length === 0) return text;
  return parts.map((part, i) =>
    typeof part === 'string' ? (
      <span key={`t-${i}`}>{part}</span>
    ) : (
      <Link key={`l-${i}`} href={part.href}>
        Open this opportunity
      </Link>
    ),
  );
}

export default function AskAnswerBody({
  answer,
  citations = [],
  onOpenOpportunity,
}: {
  answer: string;
  citations?: AskCitation[];
  /** When set (e.g. Orb session), open in-place instead of full navigation. */
  onOpenOpportunity?: (id: string) => void;
}) {
  return (
    <div className="ask-answer-body">
      <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{linkifyAnswer(answer)}</p>
      {citations.length > 0 ? (
        <ul className="ask-answer-citations" aria-label="Open related opportunities">
          {citations.map((c) => (
            <li key={c.id}>
              {onOpenOpportunity ? (
                <button type="button" className="ask-answer-cite" onClick={() => onOpenOpportunity(c.id)}>
                  Open this opportunity — {c.title}
                </button>
              ) : (
                <Link href={c.href} className="ask-answer-cite">
                  Open this opportunity — {c.title}
                </Link>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
