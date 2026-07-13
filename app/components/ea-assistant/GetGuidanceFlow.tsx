'use client';

import { FormEvent, useState } from 'react';
import { ASSISTANT_LABELS } from '@/lib/assistant/constants';
import { getSuggestedPrompts } from '@/lib/assistant/prompts';
import type { GuidanceMessage } from '@/lib/assistant/types';
import type { GuidePageContext } from '@/lib/ea-guide-types';

type GetGuidanceFlowProps = {
  pageContext: GuidePageContext;
  onBack: () => void;
  onAsk: (question: string) => Promise<GuidanceMessage>;
  messages: GuidanceMessage[];
};

export default function GetGuidanceFlow({
  pageContext,
  onBack,
  onAsk,
  messages,
}: GetGuidanceFlowProps) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const prompts = getSuggestedPrompts(pageContext.portalType, pageContext.workflow);

  async function submitQuestion(value: string) {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setQuestion('');
    try {
      await onAsk(trimmed);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await submitQuestion(question);
  }

  return (
    <div className="ea-assistant-guidance">
      <div className="ea-assistant-messages" aria-live="polite" aria-relevant="additions">
        {messages.length === 0 ? (
          <p className="ea-assistant-loading">Choose a prompt or ask your own question about this page.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`ea-assistant-message ea-assistant-message-${message.role}`}
            >
              <p>{message.content}</p>
              {message.role === 'assistant' && message.confidence ? (
                <span className="ea-assistant-confidence">{message.confidence} confidence</span>
              ) : null}
              {message.role === 'assistant' && message.nextSteps?.length ? (
                <ul className="ea-assistant-next-steps">
                  {message.nextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              ) : null}
              {message.role === 'assistant' && message.suggestEscalation ? (
                <p className="ea-assistant-escalation">{ASSISTANT_LABELS.escalationHint}</p>
              ) : null}
            </div>
          ))
        )}
        {loading ? <p className="ea-assistant-loading">Looking that up…</p> : null}
      </div>

      <div className="ea-assistant-prompts" role="group" aria-label="Suggested questions">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="ea-assistant-prompt"
            disabled={loading}
            onClick={() => submitQuestion(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <form className="ea-assistant-form" onSubmit={handleSubmit}>
        <label htmlFor="ea-assistant-question" className="sr-only">
          {ASSISTANT_LABELS.askPlaceholder}
        </label>
        <input
          id="ea-assistant-question"
          className="ea-assistant-input"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={ASSISTANT_LABELS.askPlaceholder}
          disabled={loading}
          autoComplete="off"
        />
        <button type="submit" className="ea-assistant-btn ea-assistant-btn-primary" disabled={loading || !question.trim()}>
          {ASSISTANT_LABELS.send}
        </button>
      </form>

      <div className="ea-assistant-footer" style={{ borderTop: 0, padding: '8px 0 0' }}>
        <button type="button" className="ea-assistant-btn ea-assistant-btn-muted" onClick={onBack}>
          {ASSISTANT_LABELS.backToBrief}
        </button>
      </div>
    </div>
  );
}
