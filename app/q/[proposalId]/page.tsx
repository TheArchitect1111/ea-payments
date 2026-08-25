import { notFound } from 'next/navigation';
import { getProposalByProposalId } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

const NAVY = '#17233B';
const GOLD = '#C9A844';
const CREAM = '#F6F4EF';

function fmt(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value);
}

export default async function QuickQuoteClientPage({ params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await params;
  const proposal = await getProposalByProposalId(proposalId);

  if (!proposal || proposal.recommendedProjectType !== 'Quick Quote' || !['Approved', 'Sent'].includes(proposal.status)) {
    notFound();
  }

  const deposit = Math.min(Math.max(proposal.rawFee || 500, 0), proposal.recommendedFee);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6" style={{ backgroundColor: CREAM, color: NAVY }}>
      <div className="mx-auto max-w-2xl">
        <header className="rounded-[28px] px-6 py-7 text-white sm:px-8" style={{ backgroundColor: NAVY }}>
          <img src="/images/ea-logo.png" alt="Efficiency Architects" className="h-16 w-auto" />
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>Project Quote</p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">{proposal.projectTypeLabel}</h1>
          <p className="mt-3 text-sm text-white/70">Prepared for {proposal.businessName}</p>
        </header>

        <section className="mt-4 rounded-[28px] border border-[#E1DDD3] bg-white p-6 sm:p-8">
          <p className="text-sm leading-7 text-neutral-600">
            {proposal.contactName}, here is the project scope and investment we discussed. Review it below, then continue when you are ready to accept the agreement and secure the project with your deposit.
          </p>
        </section>

        <section className="mt-4 rounded-[28px] border border-[#E1DDD3] bg-white p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: GOLD }}>Included</p>
          <div className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-700">{proposal.scopeSummary}</div>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[24px] border border-[#E1DDD3] bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Total project</p>
            <p className="mt-2 text-3xl font-black">{fmt(proposal.recommendedFee)}</p>
          </div>
          <div className="rounded-[24px] border border-[#E1DDD3] bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Deposit to begin</p>
            <p className="mt-2 text-3xl font-black">{fmt(deposit)}</p>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] p-6 text-white sm:p-8" style={{ backgroundColor: NAVY }}>
          <p className="text-sm leading-7 text-white/75">
            The next screen contains the project agreement and acceptance step. Payment is not processed until you complete secure checkout.
          </p>
          <a
            href={`/commitment/${encodeURIComponent(proposal.proposalId)}`}
            className="mt-5 block w-full rounded-full px-5 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-[#17233B]"
            style={{ backgroundColor: GOLD }}
          >
            Accept & Start Project
          </a>
        </section>

        <p className="px-4 py-7 text-center text-xs text-neutral-500">Efficiency Architects · Quote {proposal.proposalId}</p>
      </div>
    </main>
  );
}
