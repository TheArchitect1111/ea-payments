'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  buildCigarPreview,
  CIGAR_PACK_VERSION,
  primaryRole,
  updateCigarChoice,
  visibleCigarQuestions,
  type CigarAnswers,
  type CigarQuestion,
} from '@/lib/cigar-ctp/engine';

type Contact = { businessName: string; contactName: string; email: string; consent: boolean };
const EMPTY_CONTACT: Contact = { businessName: '', contactName: '', email: '', consent: false };
const STORAGE_KEY = 'ea-cigar-ctp-preview-v1.3';
const CREAM = '#F6F0E6';
const INK = '#1C211B';
const GOLD = '#B48A49';
const IMAGE_BY_ROLE: Record<string, string> = {
  brand: '/images/ctp-editorial/10-clarity-blueprint-planning.png',
  lounge: '/images/ctp-editorial/05-calm-morning-owner.png',
  distributor: '/images/ctp-editorial/06-capacity-team-collaboration.png',
  unsure: '/images/ctp-editorial/01-possibility-beach-family.png',
  other: '/images/ctp-editorial/01-possibility-beach-family.png',
};

/** Preview flow only: intentionally does not submit PII, upload files or send email. */
export default function CigarJourney() {
  const [answers, setAnswers] = useState<CigarAnswers>({});
  const [screen, setScreen] = useState(-1);
  const [ready, setReady] = useState(false);
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [contactError, setContactError] = useState('');
  const questions = useMemo(() => visibleCigarQuestions(answers), [answers]);
  const role = primaryRole(answers);
  const isQuestion = screen >= 0 && screen < questions.length;
  const question = isQuestion ? questions[screen] : null;
  const uploadStep = questions.length;
  const contactStep = questions.length + 1;
  const reviewStep = questions.length + 2;
  const resultStep = questions.length + 3;
  const preview = useMemo(() => buildCigarPreview(answers), [answers]);
  const heroImage = IMAGE_BY_ROLE[role];
  const progress = screen < 0 ? 0 : Math.min(100, Math.round(((screen + 1) / (questions.length + 3)) * 100));

  useEffect(() => {
    try {
      const existing = sessionStorage.getItem(STORAGE_KEY);
      if (existing) {
        const parsed: unknown = JSON.parse(existing);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          // Only restore answer data. Contact details and files are never persisted.
          const candidate = parsed as CigarAnswers;
          const safe: CigarAnswers = {};
          for (const q of visibleCigarQuestions({ C01: candidate.C01 ?? { selected: [], detail: '' } })) {
            const a = candidate[q.id];
            if (!a || !Array.isArray(a.selected) || typeof a.detail !== 'string') continue;
            safe[q.id] = {
              selected: a.selected.filter(id => q.options.some(o => o.id === id)).slice(0, 12),
              detail: a.detail.slice(0, 2000),
            };
          }
          setAnswers(safe);
        }
      }
    } catch { /* Private browsing can disable session storage. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers)); } catch { /* Still usable without storage. */ }
  }, [answers, ready]);

  const setChoice = (q: CigarQuestion, id: string) => {
    setAnswers(before => {
      const next = { ...before, [q.id]: updateCigarChoice(q, before[q.id], id) };
      // Changing the primary role must not carry old-path answers into summaries.
      if (q.id === 'C01') {
        const selected = next.C01.selected[0];
        for (const other of visibleCigarQuestions(before)) {
          if (other.path !== 'all' && other.path !== selected) delete next[other.id];
        }
      }
      return next;
    });
  };
  const setDetail = (id: string, detail: string) => setAnswers(before => ({
    ...before,
    [id]: { selected: before[id]?.selected ?? [], detail: detail.slice(0, 2000) },
  }));
  const advanceQuestion = () => {
    if (!question) return;
    if (!answers[question.id]?.selected?.length) return;
    setScreen(index => index + 1);
  };
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // No document bytes leave the browser. This is a placeholder UI until secure upload is implemented.
    setSelectedFile(file ? `${file.name} (selected locally only)` : '');
    event.target.value = '';
  };
  const reset = () => {
    setAnswers({}); setScreen(-1); setContact(EMPTY_CONTACT); setSelectedFile(''); setContactError('');
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
  };
  const enterReview = () => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim());
    if (!contact.businessName.trim() || !contact.contactName.trim() || !validEmail || !contact.consent) {
      setContactError('Enter your business name, your name, a valid email, and confirm consent to continue. No information will be sent in this preview.');
      return;
    }
    setContactError(''); setScreen(reviewStep);
  };

  return (
    <main className="min-h-screen" style={{ background: CREAM, color: INK }}>
      <header className="border-b border-black/10 px-5 py-5 sm:px-10" style={{ background: '#FFFCF6' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.25em]" style={{ color: GOLD }}>Efficiency Architects</div>
            <div className="mt-1 text-sm font-semibold">Cigar Business Capacity &amp; Profitability</div>
          </div>
          <div className="text-right">
            <div className="rounded-full border border-amber-600/40 px-3 py-1 text-xs font-bold">PREVIEW ONLY</div>
            <div className="mt-2 text-xs text-stone-500">No submissions or emails are sent</div>
          </div>
        </div>
        <div className="mx-auto mt-4 h-1 max-w-6xl overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Assessment progress">
          <div className="h-full rounded-full transition-all duration-300" style={{ background: GOLD, width: `${progress}%` }} />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-7 px-4 py-7 sm:px-8 lg:grid-cols-[0.86fr_1.14fr] lg:gap-12 lg:py-12">
        <aside className="overflow-hidden rounded-3xl border border-black/10 bg-stone-800 shadow-xl lg:sticky lg:top-6 lg:h-[680px]">
          <div className="relative h-[230px] lg:h-[540px]">
            {/* Images intentionally reuse licensed/current EA CTP editorial assets for the first preview. */}
            <img src={heroImage} alt="Editorial business leadership photograph" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: '#F3D49C' }}>Clarity · Capacity · Confidence</p>
              <p className="mt-3 max-w-sm text-2xl font-semibold leading-tight lg:text-3xl">Better information. Fewer unanswered questions. More room to grow.</p>
            </div>
          </div>
          <div className="bg-[#171B17] px-6 py-5 text-xs leading-6 text-stone-300">About 5–8 minutes · No exact financial figures required · Based on your experience, not guesses.</div>
        </aside>

        <section className="min-h-[540px] rounded-3xl border border-black/10 bg-white/85 px-6 py-8 shadow-xl sm:px-10 sm:py-11" aria-live="polite">
          {screen === -1 && (
            <div className="flex min-h-[470px] flex-col justify-center">
              <div className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: GOLD }}>Consider the Possibilities™ · Cigar Industry</div>
              <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">A clearer view of your business starts here.</h1>
              <p className="mt-6 text-lg leading-8 text-stone-600">Running a cigar business means balancing people, products, partners, and hundreds of moving details. Tell us how it feels today. We will help identify where more visibility and capacity may be possible.</p>
              <p className="mt-4 text-base text-stone-600">No reports, sales figures, inventory totals, or financial records are required.</p>
              <button type="button" onClick={() => setScreen(0)} className="mt-9 w-full rounded-full px-6 py-4 font-bold text-white sm:w-fit" style={{ background: INK }}>Discover My Opportunities →</button>
            </div>
          )}

          {question && (
            <div>
              <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: GOLD }}><span>{question.section}</span><span>Question {screen + 1} of {questions.length}</span></div>
              <h1 className="mt-5 text-2xl font-bold leading-tight sm:text-3xl">{question.question}</h1>
              <p className="mt-4 leading-7 text-stone-600">{question.helper}</p>
              <fieldset className="mt-7 space-y-2">
                <legend className="mb-3 text-sm font-semibold text-stone-600">{question.type === 'multi' ? 'Choose all that fit.' : 'Choose one answer.'}</legend>
                {question.options.map(option => {
                  const checked = Boolean(answers[question.id]?.selected.includes(option.id));
                  return (
                    <label key={option.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${checked ? 'border-amber-600 bg-amber-50' : 'border-stone-200 bg-white hover:border-stone-400'}`}>
                      <input
                        type={question.type === 'single' ? 'radio' : 'checkbox'}
                        name={question.id}
                        value={option.id}
                        checked={checked}
                        onChange={() => setChoice(question, option.id)}
                        className="h-5 w-5 accent-amber-700"
                      />
                      <span className="text-[15px] font-medium">{option.label}</span>
                    </label>
                  );
                })}
              </fieldset>
              <div className="mt-7 rounded-xl p-4" style={{ background: '#F8F4EA' }}>
                <label htmlFor={`detail-${question.id}`} className="block font-semibold">Anything you'd like to add? <span className="font-normal text-stone-500">(Optional)</span></label>
                <p className="mt-2 text-sm leading-6 text-stone-600">{question.detailsPrompt} If you know specific numbers, feel free to include them. There is no need to look anything up.</p>
                <textarea id={`detail-${question.id}`} maxLength={2000} value={answers[question.id]?.detail ?? ''} onChange={event => setDetail(question.id, event.target.value)} rows={3} placeholder="Tell us anything else about your experience..." className="mt-3 w-full rounded-lg border border-stone-300 bg-white p-3 outline-offset-2" />
              </div>
              <div className="mt-8 flex items-center justify-between gap-3">
                <button type="button" onClick={() => setScreen(index => index - 1)} className="rounded-full border border-stone-300 px-6 py-3 font-semibold">← Back</button>
                <button type="button" disabled={!answers[question.id]?.selected?.length} onClick={advanceQuestion} className="rounded-full px-7 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40" style={{ background: INK }}>Continue →</button>
              </div>
            </div>
          )}

          {screen === uploadStep && (
            <div className="flex min-h-[470px] flex-col justify-center">
              <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Optional documents</div>
              <h1 className="mt-5 text-3xl font-bold">Have a report you would like us to review?</h1>
              <p className="mt-5 leading-7 text-stone-600">Reports can help us understand sales, fees, overdue invoices and inventory movements. This step is optional, and you may provide files later during a secure Capacity Review.</p>
              <label htmlFor="preview-report" className="mt-7 block font-semibold">Choose an XLSX, CSV or PDF report (optional)</label>
              <input id="preview-report" type="file" accept=".xlsx,.csv,.pdf" onChange={handleFile} className="mt-3 block max-w-full text-sm" />
              {selectedFile && <p className="mt-3 text-sm font-semibold">{selectedFile}</p>}
              <p className="mt-4 text-sm text-amber-900">Preview safety: this file is not uploaded, stored, scanned or analyzed. Secure document ingestion will be a separate implementation.</p>
              <div className="mt-10 flex items-center justify-between gap-3"><button type="button" onClick={() => setScreen(index => index - 1)} className="rounded-full border border-stone-300 px-6 py-3">← Back</button><button type="button" onClick={() => setScreen(contactStep)} className="rounded-full px-7 py-3 font-bold text-white" style={{ background: INK }}>Continue →</button></div>
            </div>
          )}

          {screen === contactStep && (
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Your next step</div>
              <h1 className="mt-5 text-3xl font-bold">Where should your personalized preview go?</h1>
              <p className="mt-4 text-stone-600">For this design preview, your contact details stay in this browser tab. We do not send or save them.</p>
              <div className="mt-7 space-y-4">
                {(['businessName', 'contactName', 'email'] as const).map(field => <label key={field} className="block font-semibold">{field === 'businessName' ? 'Business name' : field === 'contactName' ? 'Your name' : 'Email address'}<input value={contact[field]} type={field === 'email' ? 'email' : 'text'} autoComplete="off" onChange={e => setContact(c => ({ ...c, [field]: e.target.value.slice(0, 140) }))} className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3" /></label>)}
                <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={contact.consent} onChange={e => setContact(c => ({ ...c, consent: e.target.checked }))} className="mt-1 h-5 w-5 accent-amber-700" /><span>I understand this is a non-submitting design preview. In the future live service, I would authorize EA to process these assessment answers and send the requested report.</span></label>
              </div>
              {contactError && <p className="mt-4 text-sm font-semibold text-red-700" role="alert">{contactError}</p>}
              <div className="mt-8 flex justify-between gap-3"><button type="button" onClick={() => setScreen(uploadStep)} className="rounded-full border border-stone-300 px-6 py-3">← Back</button><button type="button" onClick={enterReview} className="rounded-full px-6 py-3 font-bold text-white" style={{ background: INK }}>Review responses →</button></div>
            </div>
          )}

          {screen === reviewStep && (
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Review</div>
              <h1 className="mt-5 text-3xl font-bold">Here's what we've heard.</h1>
              <p className="mt-4 text-stone-600">Your selections and optional details stay together. You can go back to make changes.</p>
              <div className="mt-6 max-h-[390px] space-y-4 overflow-y-auto pr-1">
                {questions.map(q => <div key={q.id} className="border-b border-stone-200 pb-3"><p className="font-semibold">{q.question}</p><p className="mt-1 text-sm text-stone-600">{answers[q.id]?.selected.map(id => q.options.find(o => o.id === id)?.label).filter(Boolean).join(', ') || 'Not answered'}</p>{answers[q.id]?.detail && <p className="mt-1 text-sm italic text-stone-500">{answers[q.id].detail}</p>}</div>)}
              </div>
              <div className="mt-8 flex justify-between gap-3"><button type="button" onClick={() => setScreen(contactStep)} className="rounded-full border border-stone-300 px-6 py-3">← Back</button><button type="button" onClick={() => setScreen(resultStep)} className="rounded-full px-6 py-3 font-bold text-white" style={{ background: INK }}>View My Preview →</button></div>
            </div>
          )}

          {screen === resultStep && (
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Initial business opportunity preview</div>
              <h1 className="mt-5 text-3xl font-bold">Your next opportunities are becoming clearer.</h1>
              <p className="mt-4 leading-7 text-stone-600">This is a demonstration based on the answers you selected. Nothing has been submitted, emailed or saved to EA's customer records.</p>
              <div className="mt-7 space-y-4">{preview.findings.length ? preview.findings.map((f, i) => <article key={f.title} className="rounded-xl border border-stone-200 bg-white p-5"><p className="text-xs font-bold uppercase" style={{ color: GOLD }}>Opportunity {i + 1}</p><h2 className="mt-2 text-lg font-bold">{f.title}</h2><p className="mt-2 text-sm leading-6 text-stone-600">{f.explanation}</p><p className="mt-3 text-xs text-stone-500">Potential capability: {f.proposedCapability}. {f.status === 'new-development' ? 'Requires development and verification.' : 'Requires integration review.'}</p></article>) : <p className="rounded-xl bg-stone-100 p-5">No specific operational issue identified yet. A conversation can clarify your priorities.</p>}</div>
              <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Financial impact: Not yet quantified. No fictional annual savings, unpaid balances or inventory values have been created.</p>
              <p className="mt-5 text-sm leading-6 text-stone-600">Next step after this preview is approved: connect secure submissions, qualified calculations, a monitored reply address and an owner-approved Capacity Review booking link.</p>
              <button type="button" onClick={reset} className="mt-7 rounded-full px-6 py-3 font-bold text-white" style={{ background: INK }}>Start a New Preview</button>
            </div>
          )}
        </section>
      </div>
      <footer className="border-t border-stone-300 px-5 py-5 text-center text-xs text-stone-500">EA Cigar Industry OS · Guided preview {CIGAR_PACK_VERSION} · No live email, stock or order actions</footer>
    </main>
  );
}