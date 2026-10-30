'use client';
import { useState, type FormEvent } from 'react';

type Result = {
  ok: boolean; status: 'guided' | 'unanswered'; label?: string;
  step?: string; stepNumber?: number; totalSteps?: number;
  link?: string; entryKey?: string; nextStepIndex?: number | null; message?: string;
};
export default function PortalHelp() {
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState('');
  const [answer, setAnswer] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function requestHelp(q: string, entryKey?: string, stepIndex?: number) {
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/portal/amanda-catherine/eva-help', {
        method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ question: q, entryKey, stepIndex })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Help is temporarily unavailable.');
      setAnswer(d);
    } catch (e) { setError(e instanceof Error ? e.message : 'Help is temporarily unavailable.'); }
    finally { setBusy(false); }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = question.trim(); if (!q || busy) return;
    setAsked(q); setAnswer(null); void requestHelp(q);
  }
  return <section className="amanda-card" id="portal-help" aria-label="Eva portal help">
    <h2>Portal help</h2>
    <p>Ask where to find a class or how to use your portal. I’ll guide you one step at a time.</p>
    <form onSubmit={submit}>
      <label htmlFor="eva-portal-help-question">What would you like to do?</label>
      <input id="eva-portal-help-question" value={question} maxLength={500}
        onChange={e => setQuestion(e.target.value)} placeholder="How do I download my certificate?" required />
      <button data-cta-name="Show me" data-cta-key="portal-help-show-me" className="amanda-button" type="submit" disabled={busy}>{busy ? 'Checking…' : 'Show me'}</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {answer && <div role="status" aria-live="polite">
      {answer.ok ? <>
        <h3>{answer.label}</h3>
        <p><strong>Step {answer.stepNumber} of {answer.totalSteps}:</strong> {answer.step}</p>
        <a data-cta-name="Open this page" data-cta-key="portal-help-open-page" className="amanda-button" href={answer.link}>Open this page</a>
        {answer.nextStepIndex != null &&
          <button data-cta-name="Next step" data-cta-key="portal-help-next-step" type="button" className="amanda-button" disabled={busy}
            onClick={() => void requestHelp(asked, answer.entryKey, answer.nextStepIndex!)}>
            Next step
          </button>}
      </> : <p>{answer.message || 'This needs a person to review it.'}</p>}
    </div>}
  </section>;
}
