import { getProposalByProposalId } from '@/lib/airtable';
import type { ProposalWithAssessment } from '@/lib/airtable';
import { computeAdoptionHealth } from '@/lib/adoption-engine';
import { matchProofStories, defaultProofStories } from '@/lib/proof-library';
import AdoptionHealthPanel from '@/app/admin/_components/AdoptionHealthPanel';
import ProofLibraryPanel from '@/app/admin/_components/ProofLibraryPanel';

export const dynamic = 'force-dynamic';

const CALENDLY_URL =
  process.env.CALENDLY_URL ?? 'https://calendly.com/freedom-efficiencyarchitects/30min';

const RESULTS_STATUSES = new Set([
  'Pending Review',
  'Approved',
  'Sent',
  'Approved & Paid',
  'Discovery Call Requested',
]);
const PAYMENT_READY_STATUSES = new Set(['Approved', 'Sent', 'Approved & Paid']);

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);
}

function Unavailable() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="bg-neutral-950 px-6 py-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          Efficiency Architects
        </p>
        <h1 className="mt-2 text-2xl font-extrabold uppercase tracking-widest text-white">
          Proposal
        </h1>
      </div>
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-sm text-neutral-500">
          This proposal is not available. It may not exist, or it may not be ready yet.
          Contact us at{' '}
          <a
            href="mailto:freedom@efficiencyarchitects.online"
            className="font-semibold text-neutral-800 underline"
          >
            freedom@efficiencyarchitects.online
          </a>{' '}
          if you believe this is an error.
        </p>
      </div>
    </main>
  );
}

function PaymentBanner({ status }: { status: string | undefined }) {
  if (!status) return null;

  if (status === 'success') {
    return (
      <div className="border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        <strong>Payment received.</strong> Thank you for your investment. We will be in
        touch shortly to kick off your engagement.
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="border border-neutral-200 bg-neutral-100 p-4 text-sm text-neutral-600">
        Your checkout was cancelled. You can complete your investment below when you are
        ready.
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        We were unable to start your checkout. Please try again or contact us at{' '}
        <a
          href="mailto:freedom@efficiencyarchitects.online"
          className="font-semibold underline"
        >
          freedom@efficiencyarchitects.online
        </a>
        .
      </div>
    );
  }

  return null;
}

function ProposalContent({
  proposal,
  paymentStatus,
  adoption,
  proofStories,
  paymentReady,
}: {
  proposal: ProposalWithAssessment;
  paymentStatus?: string;
  adoption: ReturnType<typeof computeAdoptionHealth>;
  proofStories: ReturnType<typeof matchProofStories>;
  paymentReady: boolean;
}) {
  const firstName =
    proposal.contactName.split(' ')[0] || proposal.contactName || 'there';
  const solutionLabel =
    proposal.projectTypeLabel || proposal.recommendedProjectType || 'Custom Solution';

  const paid = paymentStatus === 'success';

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-950 px-6 py-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          Efficiency Architects
        </p>
        <h1 className="mt-2 text-2xl font-extrabold uppercase tracking-widest text-white">
          {paymentReady ? 'Your Proposal' : 'Your Capacity Analysis'}
        </h1>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-12 space-y-6">
        {/* Payment status banner */}
        <PaymentBanner status={paymentStatus} />

        {!paymentReady && (
          <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Your analysis is ready.</strong> Our team may reach out to walk through
            findings before checkout opens. Save this link — you can return anytime.
          </div>
        )}

        {/* Greeting */}
        <div className="border border-neutral-200 bg-white p-8">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-widest"
            style={{ color: '#C9A844' }}
          >
            Efficiency Architects
          </p>
          <h2 className="text-xl font-extrabold uppercase tracking-wide text-neutral-950">
            Hi {firstName}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            {paymentReady ? (
              <>
                Here is the capacity analysis and proposal we prepared for{' '}
                <strong className="text-neutral-900">{proposal.businessName}</strong>. It
                is based on what you shared in your assessment. Take a look at what we
                found.
              </>
            ) : (
              <>
                Here is what we found for{' '}
                <strong className="text-neutral-900">{proposal.businessName}</strong> based
                on your assessment. Review your capacity score and opportunity range below.
              </>
            )}
          </p>
        </div>

        {/* Opportunity cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-neutral-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Annual Opportunity
            </p>
            <p
              className="text-2xl font-extrabold leading-tight"
              style={{ color: '#1B2B4D' }}
            >
              {fmt(proposal.opportunityLow)}
              <span className="text-lg font-semibold text-neutral-400"> to </span>
              {fmt(proposal.opportunityHigh)}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              in recoverable capacity and growth opportunity per year
            </p>
          </div>

          <div className="border border-neutral-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Weekly Time Recovery
            </p>
            <p
              className="text-2xl font-extrabold leading-tight"
              style={{ color: '#1B2B4D' }}
            >
              {proposal.weeklyTimeRecovery}
              <span className="text-base font-semibold text-neutral-400"> hrs / week</span>
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              estimated hours your team can recover each week
            </p>
          </div>
        </div>

        {/* Analysis */}
        <div className="border border-neutral-200 bg-white p-8">
          <p
            className="mb-5 text-xs font-bold uppercase tracking-widest"
            style={{ color: '#C9A844' }}
          >
            Analysis
          </p>
          <div className="divide-y divide-neutral-100">
            <div className="flex justify-between py-3 text-sm">
              <span className="font-bold uppercase tracking-wider text-neutral-500 text-xs">
                Capacity Score
              </span>
              <span className="font-semibold text-neutral-900">{proposal.capacityScore}</span>
            </div>
            <div className="py-3 text-sm">
              <span className="block font-bold uppercase tracking-wider text-neutral-500 text-xs mb-1">
                Primary Focus Area
              </span>
              <span className="text-neutral-900">{proposal.primaryConstraint}</span>
            </div>
            <div className="flex justify-between py-3 text-sm">
              <span className="font-bold uppercase tracking-wider text-neutral-500 text-xs">
                Solution Category
              </span>
              <span className="font-semibold text-neutral-900">{solutionLabel}</span>
            </div>
          </div>
        </div>

        {/* Adoption + Proof (Wave 4) */}
        <AdoptionHealthPanel adoption={adoption} />
        <ProofLibraryPanel stories={proofStories} />

        {paymentReady && (
          <>
            {/* Recommended investment */}
            <div className="border border-neutral-200 bg-white p-8 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                Recommended Investment
              </p>
              <p
                className="text-4xl font-extrabold"
                style={{ color: '#1B2B4D' }}
              >
                {fmt(proposal.recommendedFee)}
              </p>
              <p className="mt-2 text-xs text-neutral-500">one-time project investment</p>
            </div>

            {/* CTA — hidden once payment is confirmed */}
            {!paid && (
              <div className="border border-neutral-200 bg-white p-8 text-center">
                <p className="mb-2 text-sm font-semibold text-neutral-700">
                  Ready to move forward?
                </p>
                <p className="mb-6 text-sm leading-relaxed text-neutral-500">
                  Click below to start your engagement. You will be taken to a secure
                  checkout to confirm your investment and kick off the work.
                </p>
                <a
                  href={`/commitment/${encodeURIComponent(proposal.proposalId)}`}
                  className="block w-full bg-neutral-950 px-6 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800"
                >
                  Start My Transformation
                </a>
                <p className="mt-4 text-xs text-neutral-400">
                  Questions before you commit? Email us at{' '}
                  <a
                    href="mailto:freedom@efficiencyarchitects.online"
                    className="font-semibold text-neutral-700 underline"
                  >
                    freedom@efficiencyarchitects.online
                  </a>
                </p>
              </div>
            )}
          </>
        )}

        {!paymentReady && (
          <div className="border border-neutral-200 bg-white p-8 text-center">
            <p className="mb-2 text-sm font-semibold text-neutral-700">
              Questions about your results?
            </p>
            <p className="mb-6 text-sm leading-relaxed text-neutral-500">
              Email us and we will schedule a walkthrough of your analysis and next steps.
            </p>
            <a
              href="mailto:freedom@efficiencyarchitects.online"
              className="inline-block bg-neutral-950 px-6 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800"
            >
              Talk With Our Team
            </a>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block border border-neutral-300 px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-700 hover:bg-neutral-50"
            >
              Schedule a Call
            </a>
          </div>
        )}

        {/* What happens next — shown after successful payment */}
        {paid && (
          <div className="border border-neutral-200 bg-white p-8">
            <p
              className="mb-3 text-xs font-bold uppercase tracking-widest"
              style={{ color: '#C9A844' }}
            >
              What Happens Next
            </p>
            <p className="text-sm leading-relaxed text-neutral-600">
              Our team will reach out within one business day to schedule your kickoff
              call and walk you through the next steps. Check your inbox for a
              confirmation receipt.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default async function ProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ proposalId: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { proposalId } = await params;
  const { payment } = await searchParams;

  if (!proposalId) {
    return <Unavailable />;
  }

  const proposal = await getProposalByProposalId(proposalId);

  if (!proposal || !RESULTS_STATUSES.has(proposal.status)) {
    return <Unavailable />;
  }

  const paymentReady = PAYMENT_READY_STATUSES.has(proposal.status);
  const adoption = computeAdoptionHealth(proposal);
  const proofStories = matchProofStories(proposal);
  const stories = proofStories.length > 0 ? proofStories : defaultProofStories();

  return (
    <ProposalContent
      proposal={proposal}
      paymentStatus={payment}
      adoption={adoption}
      proofStories={stories}
      paymentReady={paymentReady}
    />
  );
}
