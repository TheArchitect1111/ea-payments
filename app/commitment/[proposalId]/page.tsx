import { notFound } from 'next/navigation';
import { getProposalByProposalId } from '@/lib/airtable';
import CommitmentCheckout from './CommitmentCheckout';
import { getCtpSubmissionByProposalId } from '@/lib/ctp-submissions';
import { proposalDeposit } from '@/lib/proposal-deposit';

export const dynamic = 'force-dynamic';
const NAVY = '#17233B';
const GOLD = '#C9A844';
const CREAM = '#F6F4EF';
const VISIBLE_STATUSES = new Set(['Approved', 'Sent']);

function fmt(n: number) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0}).format(n); }
function estimateTimeline(fee:number){ if(fee>=10000)return '4 to 6 weeks'; if(fee>=5000)return '3 to 4 weeks'; return '2 to 3 weeks'; }

const standardSteps = [
  'Your investment is confirmed and your intelligent business system moves into production.',
  'We translate your discovery conversation into the workflows, information, and experiences your organization needs.',
  'You receive a project timeline and milestone plan within 24 hours.',
  'We build the connected public experience, private workspace, communications, documents, and operating workflows included in your plan.',
  'You review each major milestone. Nothing launches without your approval, and your system can continue growing after launch.',
];

const agreementPoints = [
  ['Scope','The work commissioned is the project scope shown in this agreement.'],
  ['Delivery','EA will build and configure the agreed experience and prepare it for review.'],
  ['Your role','Timely content, access, feedback and approvals keep the project moving.'],
  ['Payment','The deposit begins the project. The remaining balance is due before final launch or full access.'],
];

export default async function CommitmentPage({params,searchParams}:{params:Promise<{proposalId:string}>;searchParams:Promise<{stage?:string}>}) {
  const {proposalId}=await params; const {stage}=await searchParams;
  const paymentStage:'deposit'|'final'=stage==='final'?'final':'deposit';
  const proposal=await getProposalByProposalId(proposalId); if(!proposal||!VISIBLE_STATUSES.has(proposal.status))notFound();
  const solutionLabel=proposal.projectTypeLabel||proposal.recommendedProjectType||'Intelligent Business System';
  const ctpBound=await getCtpSubmissionByProposalId(proposalId).catch(()=>null);
  const standardDeposit=proposalDeposit(proposal.recommendedFee,ctpBound?.discoveryAnswers);
  const depositAmount=proposal.recommendedProjectType==='Quick Quote'?Math.min(Math.max(proposal.rawFee||standardDeposit,0),proposal.recommendedFee):standardDeposit;
  const dueNow=paymentStage==='final'?Math.max(0,proposal.recommendedFee-depositAmount):depositAmount;
  const balance=Math.max(0,proposal.recommendedFee-depositAmount);
  const isQuickQuote=proposal.recommendedProjectType==='Quick Quote';

  return <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-8" style={{backgroundColor:CREAM,color:NAVY}}>
    <div className="mx-auto max-w-4xl overflow-hidden rounded-[32px] border border-[#E5E0D5] bg-white shadow-[0_20px_70px_rgba(23,35,59,.10)]">
      <header className="relative overflow-hidden px-6 py-7 text-white sm:px-10 sm:py-9" style={{backgroundColor:NAVY}}>
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative"><div className="flex items-center justify-between gap-4"><img src="/images/ea-logo.png" alt="Efficiency Architects" className="h-14 w-auto"/><span className="rounded-full border border-white/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-white/60">Project Agreement</span></div>
        {isQuickQuote&&<div className="mt-7 grid grid-cols-4 gap-1 text-center text-[9px] font-bold uppercase tracking-[.08em]"><div className="rounded-full bg-white/10 px-2 py-2 text-white/55">01 Quote ✓</div><div className="rounded-full px-2 py-2" style={{backgroundColor:GOLD,color:NAVY}}>02 Agreement</div><div className="rounded-full bg-white/10 px-2 py-2 text-white/55">03 Deposit</div><div className="rounded-full bg-white/10 px-2 py-2 text-white/55">04 Secured</div></div>}
        <p className="mt-8 text-xs font-black uppercase tracking-[.2em]" style={{color:GOLD}}>{isQuickQuote?'Your Project Agreement':'System Confirmation'}</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">{isQuickQuote?'Everything clear. Everything agreed.':'Here is how the conversation becomes your intelligent system.'}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">{isQuickQuote?`${proposal.businessName} · ${solutionLabel}`:'Confirm your system, investment and next steps before secure checkout.'}</p></div>
      </header>

      {isQuickQuote&&<section className="border-b border-[#ECE8DF] bg-[#FAF9F6] px-6 py-5 sm:px-10"><div className="grid grid-cols-3 gap-3 text-center"><div><p className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Project</p><p className="mt-1 text-sm font-black">{fmt(proposal.recommendedFee)}</p></div><div className="border-x border-[#E4DED2]"><p className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Due now</p><p className="mt-1 text-sm font-black" style={{color:GOLD}}>{fmt(dueNow)}</p></div><div><p className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Timeline</p><p className="mt-1 text-sm font-black">2–4 weeks</p></div></div></section>}

      <section className="grid gap-6 px-6 py-8 sm:px-10 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-5">
          {isQuickQuote&&proposal.scopeSummary&&<div className="rounded-[24px] border border-[#E8E3D9] p-6"><p className="text-xs font-black uppercase tracking-[.18em]" style={{color:GOLD}}>Agreed project scope</p><div className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-650">{proposal.scopeSummary}</div></div>}
          {isQuickQuote?<div className="rounded-[24px] border border-[#E8E3D9] bg-[#FAF9F6] p-6"><p className="text-xs font-black uppercase tracking-[.18em]" style={{color:GOLD}}>What you’re agreeing to</p><div className="mt-4 space-y-3">{agreementPoints.map(([title,text])=><div key={title} className="flex gap-3 rounded-[16px] bg-white p-4"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black" style={{backgroundColor:'#F1E9CF',color:NAVY}}>✓</div><div><p className="text-sm font-black">{title}</p><p className="mt-1 text-xs leading-5 text-neutral-500">{text}</p></div></div>)}</div></div>:<div className="space-y-3">{standardSteps.map((step,index)=><div key={step} className="flex gap-4 rounded-[20px] border border-[#E8E3D9] p-5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black" style={{backgroundColor:GOLD,color:NAVY}}>{index+1}</div><p className="pt-2 text-sm font-semibold leading-6">{step}</p></div>)}</div>}
        </div>

        <aside className="h-fit rounded-[26px] border border-[#E8E3D9] bg-white p-6 shadow-[0_12px_35px_rgba(23,35,59,.06)]">
          <p className="text-xs font-black uppercase tracking-[.18em]" style={{color:GOLD}}>Agreement snapshot</p><h2 className="mt-3 text-xl font-black">{solutionLabel}</h2>
          <div className="mt-5 space-y-4 border-y border-[#EEEAE2] py-5"><div className="flex items-end justify-between"><span className="text-xs font-bold text-neutral-400">Total project</span><strong className="text-xl">{fmt(proposal.recommendedFee)}</strong></div><div className="flex items-end justify-between"><span className="text-xs font-bold text-neutral-400">{paymentStage==='final'?'Final balance':'Deposit to begin'}</span><strong className="text-xl" style={{color:GOLD}}>{fmt(dueNow)}</strong></div>{paymentStage==='deposit'&&balance>0&&<div className="flex items-end justify-between"><span className="text-xs font-bold text-neutral-400">Balance before launch</span><strong className="text-sm">{fmt(balance)}</strong></div>}<div className="flex items-end justify-between"><span className="text-xs font-bold text-neutral-400">Estimated timeline</span><strong className="text-sm">{isQuickQuote?'2–4 weeks':estimateTimeline(proposal.recommendedFee)}</strong></div></div>
          <p className="mt-5 text-xs leading-5 text-neutral-500">Review the legal terms below. Your acceptance is recorded before secure payment opens.</p>
          <CommitmentCheckout proposalId={proposal.proposalId} paymentStage={paymentStage} depositAmount={depositAmount}/>
        </aside>
      </section>
      <footer className="border-t border-[#ECE8DF] px-6 py-6 text-center text-[10px] font-bold uppercase tracking-[.15em] text-neutral-400">Efficiency Architects · Clear scope. Clear next step.</footer>
    </div>
  </main>;
}
