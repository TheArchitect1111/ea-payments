import { notFound } from 'next/navigation';
import { getProposalByProposalId } from '@/lib/airtable';
import CommitmentCheckout from './CommitmentCheckout';
import { getCtpSubmissionByProposalId } from '@/lib/ctp-submissions';
import { proposalDeposit } from '@/lib/proposal-deposit';

export const dynamic = 'force-dynamic';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';
const CREAM = '#F8F6F2';
const VISIBLE_STATUSES = new Set(['Approved', 'Sent']);

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);
}

function estimateTimeline(fee: number): string {
  if (fee >= 10000) return '4 to 6 weeks';
  if (fee >= 5000) return '3 to 4 weeks';
  return '2 to 3 weeks';
}

const steps = [
  'Your investment is confirmed and your intelligent business system moves into production.',
  'We translate your discovery conversation into the workflows, information, and experiences your organization needs.',
  'You receive a project timeline and milestone plan within 24 hours.',
  'We build the connected public experience, private workspace, communications, documents, and operating workflows included in your plan.',
  'You review each major milestone. Nothing launches without your approval, and your system can continue growing after launch.',
];

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

  if (!proposal || !VISIBLE_STATUSES.has(proposal.status)) {
    notFound();
  }

  const solutionLabel =
    proposal.projectTypeLabel || proposal.recommendedProjectType || 'Intelligent Business System';
  const ctpBound = await getCtpSubmissionByProposalId(proposalId).catch(() => null);
  const depositAmount = proposalDeposit(proposal.recommendedFee, ctpBound?.discoveryAnswers);

  return (
    <main className="min-h-screen" style={{ backgroundColor: CREAM }}>
      <section className="px-6 py-8 text-white" style={{ backgroundColor: NAVY }}>
        <div className="mx-auto max-w-4xl">
          <img src="/images/ea-logo.png" alt="Efficiency Architects" className="h-20 w-auto" />
          <div className="pb-12 pt-10">
            <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
              System Confirmation
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black uppercase tracking-wide sm:text-5xl" style={{ color: GOLD }}>
              Here is how the conversation becomes your intelligent system.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-blue-50">
              You are not simply purchasing a website and portal. You are commissioning a connected system designed to guide people, organize work, support communication, and help your organization operate more intelligently.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-6 px-6 py-12 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step} className="flex gap-4 border border-neutral-200 bg-white p-5">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-black"
                style={{ backgroundColor: GOLD, color: NAVY }}
              >
                {index + 1}
              </div>
              <p className="pt-2 text-sm font-semibold leading-6 text-neutral-800">{step}</p>
            </div>
          ))}
        </div>

        <aside className="border border-neutral-200 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: GOLD }}>
            Project Details
          </p>
          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-neutral-400">System</dt>
              <dd className="mt-1 text-sm font-semibold" style={{ color: NAVY }}>{solutionLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-neutral-400">Total project price</dt>
              <dd className="mt-1 text-2xl font-black" style={{ color: NAVY }}>{fmt(proposal.recommendedFee)}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-neutral-400">Due now</dt>
              <dd className="mt-1 text-xl font-black" style={{ color: NAVY }}>{fmt(paymentStage === 'final' ? Math.max(0, proposal.recommendedFee - depositAmount) : depositAmount)}</dd>
              <dd className="mt-1 text-xs text-neutral-500">{paymentStage === 'final' ? 'Final balance before activation and full access' : 'Project deposit after consultation and approval'}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-neutral-400">Estimated Timeline</dt>
              <dd className="mt-1 text-sm font-semibold" style={{ color: NAVY }}>{estimateTimeline(proposal.recommendedFee)}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-neutral-100 pt-5">
            <p className="text-sm font-semibold leading-7 text-neutral-700">
              Fixed investment. Clear milestones. Your approval is required at every major stage.
            </p>
          </div>

          <CommitmentCheckout proposalId={proposal.proposalId} paymentStage={paymentStage} />
          <p className="mt-4 text-center text-xs text-neutral-400">Need more time? Save this page.</p>
        </aside>
      </section>
    </main>
  );
}
