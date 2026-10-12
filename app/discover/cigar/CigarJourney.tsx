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
import {calculateCapacityImpact} from '@/lib/cigar-ctp/impact';
import {ctpCalendlyUrl} from '@/lib/ctp-calendly';
import {cigarStepImage} from '@/lib/cigar-ctp/editorial-images';
import {CIGAR_INTRO_IMAGE_TITLE, CIGAR_QUESTION_VISUAL_COPY, CIGAR_STAGE_IMAGE_TITLES} from '@/lib/cigar-ctp/visual-copy';

type PreviewReport = {fileName:string;format:string;sheets:{name:string;rows:number;category:string;preview:string[][];reportedAmounts?:{label:string;amount:number}[]}[];findings:string[];caveat:string};

type Contact = { businessName: string; contactName: string; email: string; consent: boolean };
const EMPTY_CONTACT: Contact = { businessName: '', contactName: '', email: '', consent: false };
const STORAGE_KEY = 'ea-cigar-ctp-preview-v1.3';
const CREAM = '#F6F0E6';
const INK = '#1C211B';
const GOLD = '#B48A49';
/** Preview flow only: intentionally does not submit PII, upload files or send email. */
export default function CigarJourney({live=false}:{live?:boolean}) {
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
  const [submitted,setSubmitted]=useState(false);
  const [deliveryStatus,setDeliveryStatus]=useState<'sent'|'pending'|'preview'>('pending');
  const [submissionId,setSubmissionId]=useState('');
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
  const imageKey=screen<0?'intro':question?.id ?? (screen===uploadStep?'upload':screen===contactStep?'contact':screen===reviewStep?'review':'submitted');
  const currentImage=cigarStepImage(imageKey);
  const visualCopy = question ? CIGAR_QUESTION_VISUAL_COPY[question.id] : undefined;
  const imageTitle = screen < 0
    ? CIGAR_INTRO_IMAGE_TITLE
    : question ? (visualCopy?.title ?? question.question)
      : (CIGAR_STAGE_IMAGE_TITLES[imageKey] ?? CIGAR_INTRO_IMAGE_TITLE);
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

  // The next question starts at the top on mobile and desktop, regardless of where
  // the previous answer or Continue button was positioned on the page.
  useEffect(() => {
    if (!ready) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [screen, ready]);

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
    setSubmitted(false);setDeliveryStatus('pending');setSubmissionId('');setAnswers({}); setScreen(-1); setContact(EMPTY_CONTACT); setSelectedFile(''); setReport(null); setReportStatus(''); setOptionalHours(''); setOptionalHourlyValue(''); setContactError('');
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
  };
  const submitAssessment=async()=>{
    if(!contact.consent){setContactError('Please confirm consent before submitting.');return;}
    setQaSaving(true);setContactError('');
    const fictional=!live && /^(QA|Test)\b/i.test(contact.businessName)&&/^(QA|Test)\b/i.test(contact.contactName)&&/@[a-z0-9.-]+\.example$/i.test(contact.email);
    try{
      const response=await fetch(fictional?'/api/cigar-ctp/preview/submit':'/api/cigar-ctp/submit',{
        method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
        body:JSON.stringify({qaOnly:fictional,consent:true,businessName:contact.businessName,contactName:contact.contactName,email:contact.email,answers,
         hoursPerWeek:optionalHours.trim()?Number(optionalHours):null,laborCostPerHour:optionalHourlyValue.trim()?Number(optionalHourlyValue):null})
      });
      const json=await response.json();if(!response.ok||!json.ok)throw new Error(json.error??'Submission could not be completed.');
      setDeliveryStatus(fictional?'preview':json.emailStatus==='sent'?'sent':'pending');
      setSubmissionId(json.submissionId??json.qaSubmissionId??'');
      setSubmitted(true);setScreen(resultStep);
      try{sessionStorage.removeItem(STORAGE_KEY);}catch{}
    }catch(err){setContactError(err instanceof Error?err.message:'Unable to submit your assessment. Please try again.');}
    finally{setQaSaving(false);}
  };
  const enterReview = () => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim());
    if (!contact.businessName.trim() || !contact.contactName.trim() || !validEmail || !contact.consent) {
      setContactError('Enter your business name, your name, a valid email, and confirm consent to continue. Your information is not submitted until you select Submit Assessment.');
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
            <div className="rounded-full border border-amber-600/40 px-3 py-1 text-xs font-bold">{live?"CAPACITY ASSESSMENT":"PREVIEW ONLY"}</div>
            <div className="mt-2 text-xs text-stone-500">{live?"Personalized assessment reports by email":"No customer submissions or emails are sent"}</div>
          </div>
        </div>
        <div className="mx-auto mt-4 h-1 max-w-6xl overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Assessment progress">
          <div className="h-full rounded-full transition-all duration-300" style={{ background: GOLD, width: `${progress}%` }} />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-7 px-4 py-7 sm:px-8 lg:grid-cols-[0.86fr_1.14fr] lg:gap-12 lg:py-12">
        <aside className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-lg lg:sticky lg:top-6 lg:self-start">
          <div className="relative isolate aspect-[16/10] w-full overflow-hidden bg-[#211C18] lg:aspect-[4/5]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-[-8%] scale-110 bg-cover bg-center opacity-60 blur-xl"
              style={{backgroundImage:`url("${currentImage.src}")`}} />
            <img key={imageKey} src={currentImage.src} alt={currentImage.alt}
              loading={screen <= 0 ? 'eager' : 'lazy'}
              onError={event => {if (!event.currentTarget.src.includes('/images/ctp-editorial/')) event.currentTarget.src='/images/ctp-editorial/10-clarity-blueprint-planning.png';}}
              className="relative z-[1] block h-full w-full object-contain object-center" style={{zIndex:1}} />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black/40 via-transparent to-black/50" style={{zIndex:2}} />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] px-5 pt-5 sm:px-7 sm:pt-7" style={{zIndex:3}}>
              <p className="text-[10px] font-bold uppercase leading-5 tracking-[0.13em] text-white sm:text-xs sm:tracking-[0.18em]"
                style={{textShadow:'0 2px 7px rgba(0,0,0,0.8)'}}>
                CLARITY · CAPACITY · CONFIDENCE
              </p>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] px-5 pb-5 text-white sm:px-7 sm:pb-7" style={{zIndex:3}}>
              <h2 className="max-w-[25ch] text-xl font-semibold leading-tight sm:text-2xl lg:text-3xl"
                style={{textShadow:'0 2px 10px rgba(0,0,0,0.8)'}}>{imageTitle}</h2>
            </div>
          </div>
          <p className="px-6 py-4 text-sm font-medium text-stone-600">This assessment will take 5–8 minutes.</p>
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
              <p className="mt-3 text-sm leading-6 text-stone-600" data-testid="cigar-question-why">{visualCopy?.reason}</p>
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
              <h1 className="mt-5 text-3xl font-bold">Where should your personalized report go?</h1>
              <p className="mt-4 text-stone-600">Enter where you would like your personalized report sent. We'll process your answers after you submit and follow up by email. {live?"":"In preview, use fictional QA details to test safely."}</p>
              <div className="mt-7 space-y-4">
                {(['businessName', 'contactName', 'email'] as const).map(field => <label key={field} className="block font-semibold">{field === 'businessName' ? 'Business name' : field === 'contactName' ? 'Your name' : 'Email address'}<input value={contact[field]} type={field === 'email' ? 'email' : 'text'} autoComplete="off" onChange={e => setContact(c => ({ ...c, [field]: e.target.value.slice(0, 140) }))} className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3" /></label>)}
                <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={contact.consent} onChange={e => setContact(c => ({ ...c, consent: e.target.checked }))} className="mt-1 h-5 w-5 accent-amber-700" /><span>I authorize Efficiency Architects to save my assessment answers and email me my requested report and next steps.</span></label>
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
              <div className="mt-8 flex justify-between gap-3"><button type="button" onClick={() => setScreen(contactStep)} className="rounded-full border border-stone-300 px-6 py-3">← Back</button><button type="button" onClick={submitAssessment} disabled={qaSaving} className="rounded-full px-6 py-3 font-bold text-white disabled:opacity-50" style={{ background: INK }}>{qaSaving?"Submitting…":"Submit Assessment →"}</button></div>
            </div>
          )}

          {screen === resultStep && submitted && (
            <div className="flex min-h-[470px] flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#EDF2E9] text-3xl text-[#365E40]" aria-hidden="true">✓</div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{color:GOLD}}>Your next steps</p>
              <h1 className="mt-4 text-4xl font-bold">Thank you!</h1>
              <p className="mt-5 max-w-lg text-lg leading-8">Your Cigar Business Capacity Assessment has been received.</p>
              {deliveryStatus==='preview'?<p className="mt-4 max-w-lg text-stone-600">Your fictional test assessment was saved successfully. This preview does not send emails. The complete personalized report is ready for the configured email workflow.</p>:<p className="mt-4 max-w-lg text-stone-600">We're preparing your personalized assessment report and recommended next steps. {deliveryStatus==='sent'?'Please check your email for your results and the link to book your Strategy Meeting.':'Please check your email shortly. If delivery takes longer than expected, our team has your assessment for follow-up.'}</p>}
              <a href={ctpCalendlyUrl()} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block rounded-full bg-[#1C211B] px-7 py-4 font-bold text-white">Book Your 15-Minute Strategy Meeting ↗</a>
              <p className="mt-4 text-xs text-stone-500">Reference: {submissionId}</p>
              <button type="button" onClick={reset} className="mt-7 text-sm font-semibold underline">Start another assessment</button>
            </div>
          )}
        </section>
      </div>
      <footer className="border-t border-stone-300 px-5 py-5 text-center text-xs text-stone-500">EA Cigar Industry OS · Guided {live?'assessment':'preview'} {CIGAR_PACK_VERSION} · No live stock or vendor order actions</footer>
    </main>
  );
}