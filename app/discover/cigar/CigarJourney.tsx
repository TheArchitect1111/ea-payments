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
import {buildAssessmentEmailPreview, calculateCapacityImpact} from '@/lib/cigar-ctp/impact';

type PreviewReport = {fileName:string;format:string;sheets:{name:string;rows:number;category:string;preview:string[][];reportedAmounts?:{label:string;amount:number}[]}[];findings:string[];caveat:string};

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
  const [report, setReport] = useState<PreviewReport | null>(null);
  const [reportStatus, setReportStatus] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [optionalHours,setOptionalHours] = useState('');
  const [optionalHourlyValue,setOptionalHourlyValue] = useState('');
  const [contactError, setContactError] = useState('');
  const [qaSaving,setQaSaving]=useState(false);
  const [qaResult,setQaResult]=useState('');
  const questions = useMemo(() => visibleCigarQuestions(answers), [answers]);
  const role = primaryRole(answers);
  const isQuestion = screen >= 0 && screen < questions.length;
  const question = isQuestion ? questions[screen] : null;
  const uploadStep = questions.length;
  const contactStep = questions.length + 1;
  const reviewStep = questions.length + 2;
  const resultStep = questions.length + 3;
  const preview = useMemo(() => buildCigarPreview(answers), [answers]);
  const impact = useMemo(()=>calculateCapacityImpact({
    hoursPerWeek:optionalHours.trim()?Number(optionalHours):null,
    laborCostPerHour:optionalHourlyValue.trim()?Number(optionalHourlyValue):null,
  }),[optionalHours,optionalHourlyValue]);
  const emailPreview=useMemo(()=>buildAssessmentEmailPreview(contact,answers,preview.findings,impact),[contact,answers,preview.findings,impact]);
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
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setSelectedFile(file?.name ?? '');
    setReport(null);
    setReportStatus('');
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setReportStatus('Choose a file smaller than 4 MB.'); return; }
    const data = new FormData(); data.set('report', file);
    setReportLoading(true);
    try {
      const response = await fetch('/api/cigar-ctp/preview/report', {method:'POST',body:data,cache:'no-store'});
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error ?? 'Analysis could not finish.');
      setReport(result.analysis as PreviewReport);
      setReportStatus('Report examined in temporary staging. Data is not saved or verified.');
    } catch (error) {
      setReportStatus(error instanceof Error ? error.message : 'Could not read the report.');
    } finally { setReportLoading(false); }
  };
  const reset = () => {
    setAnswers({}); setScreen(-1); setContact(EMPTY_CONTACT); setSelectedFile(''); setReport(null); setReportStatus(''); setOptionalHours(''); setOptionalHourlyValue(''); setContactError(''); setQaResult('');
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
  };
  const saveQaOnly=async()=>{
    setQaResult('');
    const business=contact.businessName.trim(),name=contact.contactName.trim(),email=contact.email.trim();
    if(!/^(QA|Test)\\b/i.test(business)||!/^(QA|Test)\\b/i.test(name)||!/@[a-z0-9.-]+\\.example$/i.test(email)){
      setQaResult('QA mode requires fictional company and contact names starting with QA or Test, plus an email ending .example. No real customer details.');
      return;
    }
    setQaSaving(true);
    try{
      const response=await fetch('/api/cigar-ctp/preview/submit',{
       method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
       body:JSON.stringify({qaOnly:true,consent:contact.consent,businessName:business,contactName:name,email,answers,
          hoursPerWeek:optionalHours.trim()?Number(optionalHours):null,
          laborCostPerHour:optionalHourlyValue.trim()?Number(optionalHourlyValue):null}),
      });
      const result=await response.json();
      if(!response.ok||!result.ok)throw new Error(result.error??'QA submission failed');
      setQaResult('Staging-only QA record saved: '+result.qaSubmissionId+'. No assessment email or vendor message was sent.');
    }catch(error){setQaResult(error instanceof Error?error.message:'Unable to save staging QA record.');}
    finally{setQaSaving(false);}
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
              {selectedFile && <p className="mt-3 text-sm font-semibold">Selected: {selectedFile}</p>}
              {reportLoading && <p className="mt-3 text-sm" role="status">Examining report, please wait…</p>}
              {reportStatus && <p className="mt-3 text-sm text-amber-900" role="status">{reportStatus}</p>}
              {report && <div className="mt-4 space-y-3 rounded-xl border border-stone-200 bg-white p-4">
                <h2 className="font-bold">Report analysis · {report.sheets.length} section(s)</h2>
                {report.sheets.map((s,i)=><div key={i} className="border-b pb-2"><p className="font-semibold">{s.name}</p><p className="text-sm text-stone-600">{s.rows} rows · {s.category}</p></div>)}
                {report.sheets.filter(s=>s.reportedAmounts?.length).map((s,i)=><div key={i} className="rounded-lg bg-stone-50 p-3"><p className="mb-2 text-sm font-bold">Amounts stated in {s.name} (not yet reconciled)</p>{s.reportedAmounts?.slice(0,10).map((a,k)=><p key={k} className="flex justify-between gap-4 text-xs"><span>{a.label}</span><span className="font-semibold">{a.amount.toLocaleString("en-US",{style:"currency",currency:"USD"})}</span></p>)}</div>)}
                {report.findings.map((f,i)=><p key={i} className="text-sm text-stone-700">• {f}</p>)}
                <p className="text-xs text-amber-900">{report.caveat}</p>
              </div>}
              <p className="mt-4 text-sm text-amber-900">Your report is processed temporarily. It is not stored or attached to your profile. Do not upload confidential customer details or unredacted financial statements during this preview.</p>
              <div className="mt-10 flex items-center justify-between gap-3"><button type="button" onClick={() => setScreen(index => index - 1)} className="rounded-full border border-stone-300 px-6 py-3">← Back</button><button type="button" onClick={() => setScreen(contactStep)} className="rounded-full px-7 py-3 font-bold text-white" style={{ background: INK }}>Continue →</button></div>
            </div>
          )}

          {screen === contactStep && (
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Your next step</div>
              <h1 className="mt-5 text-3xl font-bold">Where should your personalized preview go?</h1>
              <p className="mt-4 text-stone-600">Your answers and contact details stay in this browser tab unless you intentionally choose the staging-only QA save on the results screen. That accepts fictional names and a .example email only. No mail is sent.</p>
              <div className="mt-7 space-y-4">
                {(['businessName', 'contactName', 'email'] as const).map(field => <label key={field} className="block font-semibold">{field === 'businessName' ? 'Business name' : field === 'contactName' ? 'Your name' : 'Email address'}<input value={contact[field]} type={field === 'email' ? 'email' : 'text'} autoComplete="off" onChange={e => setContact(c => ({ ...c, [field]: e.target.value.slice(0, 140) }))} className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3" /></label>)}
                <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={contact.consent} onChange={e => setContact(c => ({ ...c, consent: e.target.checked }))} className="mt-1 h-5 w-5 accent-amber-700" /><span>I understand this is a non-submitting design preview. In the future live service, I would authorize EA to process these assessment answers and send the requested report.</span></label>
              </div>
              <details className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
                <summary className="cursor-pointer font-semibold">Know any time or labor figures? (Entirely optional)</summary>
                <p className="mt-3 text-sm text-stone-600">If you know roughly how much time you spend on one recurring reporting task, you can share it here. You may leave both blank. This never assumes cash savings.</p>
                <label className="mt-3 block text-sm">Hours per week <input aria-label="Optional hours per week" type="number" min="0" max="168" step="0.5" value={optionalHours} onChange={e=>setOptionalHours(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 p-2"/></label>
                <label className="mt-3 block text-sm">Approximate hourly labor value in USD <input aria-label="Optional hourly labor value" type="number" min="0" max="1000" step="0.01" value={optionalHourlyValue} onChange={e=>setOptionalHourlyValue(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 p-2"/></label>
              </details>
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
              <p className="mt-4 leading-7 text-stone-600">This is a demonstration based on your selections. No customer intake records are created, and no email is sent. A separate optional QA save uses fictional test records only.</p>
              <div className="mt-7 space-y-4">{preview.findings.length ? preview.findings.map((f, i) => <article key={f.title} className="rounded-xl border border-stone-200 bg-white p-5"><p className="text-xs font-bold uppercase" style={{ color: GOLD }}>Opportunity {i + 1}</p><h2 className="mt-2 text-lg font-bold">{f.title}</h2><p className="mt-2 text-sm leading-6 text-stone-600">{f.explanation}</p><p className="mt-3 text-xs text-stone-500">Potential capability: {f.proposedCapability}. {f.status === 'new-development' ? 'Requires development and verification.' : 'Requires integration review.'}</p></article>) : <p className="rounded-xl bg-stone-100 p-5">No specific operational issue identified yet. A conversation can clarify your priorities.</p>}</div>
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-bold">Capacity and financial impact</p>
                {impact.annualHours!==null&&<p className="mt-2">Estimated time in this process: {impact.annualHours.toLocaleString()} hours annually, based on your optional answer.</p>}
                {impact.annualLaborCapacityValue!==null&&<p className="mt-2">Associated annual labor capacity value: ${impact.annualLaborCapacityValue.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}. This is not a cash-saving promise.</p>}
                <p className="mt-2">{impact.note}</p>
                <p className="mt-2">No fictional sales, profits, inventory balances, or double-counted revenue have been created.</p>
              </div>
              <details className="mt-5 rounded-xl border border-stone-200 bg-white p-4"><summary className="cursor-pointer font-bold">View your personalized email preview</summary><h2 className="mt-4 font-semibold">{emailPreview.subject}</h2><pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-stone-700">{emailPreview.body}</pre><p className="mt-3 text-xs text-amber-900">Not sent. A secure, authorized mailer must be configured before launch.</p></details>
              <details className="mt-4 rounded-xl border border-stone-200 bg-white p-4"><summary className="cursor-pointer font-bold">How limited vendor follow-ups would work</summary><p className="mt-3 text-sm text-stone-700">EA could acknowledge a received report or request an overdue scheduled report after the owner authorizes a specific recipient and reminder schedule. Invoice disputes, orders and payments require a human. Vendor mail sending is disabled in this preview.</p></details>
              {report && <div className="mt-5 rounded-xl border border-stone-200 p-4"><h2 className="font-bold">Your report analysis</h2><p className="mt-2 text-sm">We identified {report.sheets.length} report section(s). Figures require confirmation against source records.</p>{report.findings.map((x,i)=><p className="mt-2 text-sm" key={i}>• {x}</p>)}</div>}
              <p className="mt-5 text-sm leading-6 text-stone-600">The secure client record, actual assessment email, mailbox provisioning and Capacity Review booking integration require a separate, verified release. No vendor message has been sent.</p>
              <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4">
                <h2 className="font-bold">Staging QA only: save a fictional test assessment</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">To test EA's Airtable handoff, use a business name starting with QA or Test, a contact name starting with QA or Test, and an email ending .example. This saves only a test record. It never sends the draft email or triggers real sales workflows.</p>
                <button type="button" disabled={qaSaving} onClick={saveQaOnly} className="mt-3 rounded-full border border-stone-700 px-5 py-2 text-sm font-bold disabled:opacity-50">{qaSaving?'Saving QA record…':'Save Fictional QA Assessment'}</button>
                {qaResult&&<p className="mt-3 break-words text-sm" role="status">{qaResult}</p>}
              </div>
              <button type="button" onClick={reset} className="mt-7 rounded-full px-6 py-3 font-bold text-white" style={{ background: INK }}>Start a New Preview</button>
            </div>
          )}
        </section>
      </div>
      <footer className="border-t border-stone-300 px-5 py-5 text-center text-xs text-stone-500">EA Cigar Industry OS · Guided preview {CIGAR_PACK_VERSION} · No live email, stock or order actions</footer>
    </main>
  );
}