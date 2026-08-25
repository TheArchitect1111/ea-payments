import { notFound } from 'next/navigation';
import { getProposalByProposalId } from '@/lib/airtable';
import CommitmentCheckout from './CommitmentCheckout';
import { getCtpSubmissionByProposalId } from '@/lib/ctp-submissions';
import { proposalDeposit } from '@/lib/proposal-deposit';

export const dynamic = 'force-dynamic';

const NAVY = '#17233B';
const GOLD = '#C9A844';
const CREAM = '#F5F2EA';
const INK = '#182238';
const VISIBLE_STATUSES = new Set(['Approved', 'Sent']);

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

function estimateTimeline(fee: number) {
  if (fee >= 10000) return '4 to 6 weeks';
  if (fee >= 5000) return '3 to 4 weeks';
  return '2 to 3 weeks';
}

const agreementPoints = [
  ['01', 'Project scope', 'The work commissioned is the scope described below. Anything outside that scope is handled separately and agreed before additional work begins.'],
  ['02', 'Delivery & review', 'EA builds the agreed experience, presents major milestones for review, and completes agreed refinements before launch.'],
  ['03', 'Client participation', 'Timely access, content, feedback, and approvals help keep the project on schedule.'],
  ['04', 'Investment & launch', 'The deposit starts the project. The remaining balance is due before final launch or full administrator access.'],
];

const standardSteps = [
  'Your investment is confirmed and your intelligent business system moves into production.',
  'We translate your discovery conversation into the workflows, information, and experiences your organization needs.',
  'You receive a project timeline and milestone plan within 24 hours.',
  'We build the connected public experience, private workspace, communications, documents, and operating workflows included in your plan.',
  'You review each major milestone. Nothing launches without your approval.',
];

function BrandLockup() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D9D2C3] text-sm font-black" style={{ color: NAVY }}>EA</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: NAVY }}>Efficiency Architects</p>
        <p className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-neutral-400">Building smarter operations</p>
      </div>
    </div>
  );
}

export default async function CommitmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ proposalId: string }>;
  searchParams: Promise<{ stage?: string }>;
}) {
  const { proposalId } = await params;
  const { stage } = await searchParams;
  const paymentStage: 'deposit' | 'final' = stage === 'final' ? 'final' : 'deposit';
  const proposal = await getProposalByProposalId(proposalId);
  if (!proposal || !VISIBLE_STATUSES.has(proposal.status)) notFound();

  const solutionLabel = proposal.projectTypeLabel || proposal.recommendedProjectType || 'Intelligent Business System';
  const ctpBound = await getCtpSubmissionByProposalId(proposalId).catch(() => null);
  const standardDeposit = proposalDeposit(proposal.recommendedFee, ctpBound?.discoveryAnswers);
  const depositAmount = proposal.recommendedProjectType === 'Quick Quote'
    ? Math.min(Math.max(proposal.rawFee || standardDeposit, 0), proposal.recommendedFee)
    : standardDeposit;
  const dueNow = paymentStage === 'final' ? Math.max(0, proposal.recommendedFee - depositAmount) : depositAmount;
  const balance = Math.max(0, proposal.recommendedFee - depositAmount);
  const isQuickQuote = proposal.recommendedProjectType === 'Quick Quote';
  const timeline = isQuickQuote ? '2–4 weeks' : estimateTimeline(proposal.recommendedFee);

  return (
    <main className="min-h-screen px-3 py-3 sm:px-6 sm:py-8" style={{ backgroundColor: CREAM, color: INK }}>
      <div className="mx-auto max-w-4xl overflow-hidden rounded-[26px] border border-[#E1DCCE] bg-[#FFFEFB] shadow-[0_24px_80px_rgba(24,34,56,0.08)] sm:rounded-[34px]">
        <header className="px-6 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-8">
          <div className="flex items-start justify-between gap-4">
            <BrandLockup />
            <span className="rounded-full border border-[#DDD6C9] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-500">Agreement</span>
          </div>

          {isQuickQuote ? (
            <div className="mt-8">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                <span>Quote</span><span className="h-px flex-1 bg-[#DDD8CE]"/><span style={{ color: NAVY }}>Agreement</span><span className="h-px flex-1 bg-[#DDD8CE]"/><span>Deposit</span><span className="h-px flex-1 bg-[#DDD8CE]"/><span>Secured</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#ECE8E0]"><div className="h-full w-2/4 rounded-full" style={{ backgroundColor: GOLD }} /></div>
            </div>
          ) : null}

          <div className="mt-10 max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: GOLD }}>Project agreement</p>
            <h1 className="mt-3 text-[2.35rem] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl">A clear agreement for the work ahead.</h1>
            <p className="mt-5 text-sm leading-7 text-neutral-500">Prepared for <strong className="font-semibold" style={{ color: NAVY }}>{proposal.businessName}</strong> for the <strong className="font-semibold" style={{ color: NAVY }}>{solutionLabel}</strong> project.</p>
          </div>
        </header>

        <section className="border-y border-[#E8E3D9] bg-[#FAF8F3] px-6 py-5 sm:px-10">
          <div className="grid grid-cols-3 divide-x divide-[#DDD7CA]">
            <div className="pr-3"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400">Project</p><p className="mt-2 text-lg font-semibold" style={{ color: NAVY }}>{fmt(proposal.recommendedFee)}</p></div>
            <div className="px-3"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400">Due now</p><p className="mt-2 text-lg font-semibold" style={{ color: GOLD }}>{fmt(dueNow)}</p></div>
            <div className="pl-3"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400">Timeline</p><p className="mt-2 text-lg font-semibold" style={{ color: NAVY }}>{timeline}</p></div>
          </div>
        </section>

        <section className="px-6 py-9 sm:px-10 sm:py-12">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              {isQuickQuote && proposal.scopeSummary ? (
                <section>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: GOLD }}>01 · Project scope</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em]" style={{ color: NAVY }}>What we are building</h2>
                  <div className="mt-5 border-l-2 pl-5 text-sm leading-7 text-neutral-600" style={{ borderColor: GOLD }}>{proposal.scopeSummary}</div>
                </section>
              ) : null}

              <section className={isQuickQuote ? 'mt-10 border-t border-[#E8E3D9] pt-9' : ''}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: GOLD }}>{isQuickQuote ? '02 · Agreement summary' : 'What happens next'}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em]" style={{ color: NAVY }}>{isQuickQuote ? 'The important terms, in plain language' : 'From agreement to production'}</h2>
                {isQuickQuote ? (
                  <div className="mt-6 divide-y divide-[#E9E4DA] border-y border-[#E9E4DA]">
                    {agreementPoints.map(([number, title, text]) => (
                      <div key={number} className="grid grid-cols-[34px_1fr] gap-3 py-5">
                        <span className="pt-0.5 text-xs font-black" style={{ color: GOLD }}>{number}</span>
                        <div><h3 className="text-sm font-semibold" style={{ color: NAVY }}>{title}</h3><p className="mt-1 text-xs leading-6 text-neutral-500">{text}</p></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 divide-y divide-[#E9E4DA] border-y border-[#E9E4DA]">
                    {standardSteps.map((step, index) => <div key={step} className="grid grid-cols-[34px_1fr] gap-3 py-5"><span className="text-xs font-black" style={{ color: GOLD }}>0{index + 1}</span><p className="text-sm leading-6 text-neutral-600">{step}</p></div>)}
                  </div>
                )}
              </section>
            </div>

            <aside className="h-fit rounded-[24px] border border-[#E4DED2] bg-white p-6 shadow-[0_12px_34px_rgba(24,34,56,0.05)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">Investment summary</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em]" style={{ color: NAVY }}>{solutionLabel}</h2>

              <dl className="mt-6 divide-y divide-[#EEEAE2] border-y border-[#EEEAE2]">
                <div className="flex items-baseline justify-between gap-4 py-4"><dt className="text-xs text-neutral-500">Total project</dt><dd className="text-lg font-semibold" style={{ color: NAVY }}>{fmt(proposal.recommendedFee)}</dd></div>
                <div className="flex items-baseline justify-between gap-4 py-4"><dt className="text-xs text-neutral-500">{paymentStage === 'final' ? 'Final balance' : 'Deposit to begin'}</dt><dd className="text-lg font-semibold" style={{ color: GOLD }}>{fmt(dueNow)}</dd></div>
                {paymentStage === 'deposit' && balance > 0 ? <div className="flex items-baseline justify-between gap-4 py-4"><dt className="text-xs text-neutral-500">Balance before launch</dt><dd className="text-sm font-semibold" style={{ color: NAVY }}>{fmt(balance)}</dd></div> : null}
                <div className="flex items-baseline justify-between gap-4 py-4"><dt className="text-xs text-neutral-500">Estimated timeline</dt><dd className="text-sm font-semibold" style={{ color: NAVY }}>{timeline}</dd></div>
              </dl>

              <CommitmentCheckout proposalId={proposal.proposalId} paymentStage={paymentStage} depositAmount={depositAmount} />
            </aside>
          </div>
        </section>

        <footer className="border-t border-[#E8E3D9] px-6 py-6 sm:px-10">
          <div className="flex items-center justify-between gap-4 text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400"><span>Efficiency Architects</span><span>Clear terms · Secure payment</span></div>
        </footer>
      </div>
    </main>
  );
}
