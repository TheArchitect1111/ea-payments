import { getProposalByProposalId } from '@/lib/airtable';
import type { ProposalWithAssessment } from '@/lib/airtable';
import { computeAdoptionHealth } from '@/lib/adoption-engine';
import { matchProofStories, defaultProofStories } from '@/lib/proof-library';
import AdoptionHealthPanel from '@/app/admin/_components/AdoptionHealthPanel';
import ProofLibraryPanel from '@/app/admin/_components/ProofLibraryPanel';

export const dynamic = 'force-dynamic';

const CALENDLY_URL =
  process.env.CALENDLY_URL ?? 'https://calendly.com/freedom-efficiencyarchitects/30min';

const CREAM = '#F5F1E8';
const PAPER = '#FFFBF2';
const BLACK = '#0A0A0A';
const EARTH = '#5E5141';
const GOLD = '#D8AD3D';
const GOLD_BRIGHT = '#F6D66B';

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
    <main className="min-h-screen" style={{ backgroundColor: CREAM, color: BLACK }}>
      <div className="border-b px-6 py-8 text-center" style={{ borderColor: 'rgba(10,10,10,0.08)' }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
          Efficiency Architects
        </p>
        <h1 className="mt-2 text-2xl font-extrabold uppercase tracking-widest">
          Strategic Blueprint
        </h1>
      </div>
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-sm" style={{ color: EARTH }}>
          This Blueprint is not available yet. It may still be in preparation. Contact us at{' '}
          <a
            href="mailto:freedom@efficiencyarchitects.online"
            className="font-semibold underline"
            style={{ color: BLACK }}
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
        <strong>Investment confirmed.</strong> Thank you. We will be in touch shortly to begin the Blueprint work.
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="border border-neutral-200 bg-neutral-100 p-4 text-sm text-neutral-600">
        Your secure confirmation was paused. You can return to your Blueprint whenever you are ready.
      </div>
    );
  }

  if (status === 'pending_review') {
    return (
      <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Your Blueprint is being finalized.</strong> Secure confirmation opens once our team completes the review, usually within one business day. We will email you when it is ready.
      </div>
    );
  }


  if (status === 'error') {
    return (
      <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        We were unable to open secure confirmation. Please try again or contact us at{' '}
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
    <main className="min-h-screen" style={{ backgroundColor: CREAM, color: BLACK }}>
      <div
        className="border-b px-6 py-8 text-center"
        style={{ borderColor: 'rgba(10,10,10,0.08)', backgroundColor: 'rgba(245,241,232,0.9)' }}
      >
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
          Efficiency Architects
        </p>
        <h1 className="mt-2 text-2xl font-extrabold uppercase tracking-widest">
          {paymentReady ? 'Your Strategic Blueprint' : 'Your Blueprint Preview'}
        </h1>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <PaymentBanner status={paymentStatus} />

        {!paymentReady && (
          <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Your Blueprint preview is ready.</strong> Our team may reach out to walk through
            findings before secure confirmation opens. Save this link and return anytime.
          </div>
        )}

        <div className="border p-8 shadow-[0_18px_60px_rgba(10,10,10,0.06)]" style={{ backgroundColor: PAPER, borderColor: 'rgba(10,10,10,0.1)' }}>
          <p
            className="mb-2 text-xs font-bold uppercase tracking-widest"
            style={{ color: GOLD }}
          >
            Continue The Conversation
          </p>
          <h2 className="text-3xl font-extrabold leading-tight">
            Hi {firstName}
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: EARTH }}>
            {paymentReady ? (
              <>
                Here is the Strategic Blueprint we prepared for{' '}
                <strong style={{ color: BLACK }}>{proposal.businessName}</strong>. It
                continues from what you shared in the discovery conversation and turns the insight into a practical path.
              </>
            ) : (
              <>
                Here is what we found for{' '}
                <strong style={{ color: BLACK }}>{proposal.businessName}</strong> based
                on the discovery conversation. Review the capacity signal and opportunity range below.
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border p-6" style={{ backgroundColor: PAPER, borderColor: 'rgba(10,10,10,0.1)' }}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
              Annual Opportunity
            </p>
            <p className="text-2xl font-extrabold leading-tight">
              {fmt(proposal.opportunityLow)}
              <span className="text-lg font-semibold" style={{ color: EARTH }}> to </span>
              {fmt(proposal.opportunityHigh)}
            </p>
            <p className="mt-1 text-xs" style={{ color: EARTH }}>
              in recoverable capacity and growth opportunity per year
            </p>
          </div>

          <div className="border p-6" style={{ backgroundColor: PAPER, borderColor: 'rgba(10,10,10,0.1)' }}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
              Weekly Time Recovery
            </p>
            <p className="text-2xl font-extrabold leading-tight">
              {proposal.weeklyTimeRecovery}
              <span className="text-base font-semibold" style={{ color: EARTH }}> hrs / week</span>
            </p>
            <p className="mt-1 text-xs" style={{ color: EARTH }}>
              estimated hours your team can recover each week
            </p>
          </div>
        </div>

        <div className="border p-8" style={{ backgroundColor: PAPER, borderColor: 'rgba(10,10,10,0.1)' }}>
          <p
            className="mb-5 text-xs font-bold uppercase tracking-widest"
            style={{ color: GOLD }}
          >
            Blueprint Signals
          </p>
          <div className="divide-y divide-neutral-100">
            <div className="flex justify-between py-3 text-sm">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: EARTH }}>
                Capacity Score
              </span>
              <span className="font-semibold">{proposal.capacityScore}</span>
            </div>
            <div className="py-3 text-sm">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: EARTH }}>
                Primary Focus Area
              </span>
              <span>{proposal.primaryConstraint}</span>
            </div>
            <div className="flex justify-between py-3 text-sm">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: EARTH }}>
                Solution Category
              </span>
              <span className="font-semibold">{solutionLabel}</span>
            </div>
          </div>
        </div>

        <AdoptionHealthPanel adoption={adoption} />
        <ProofLibraryPanel stories={proofStories} />

        {paymentReady && (
          <>
            <div className="border p-8 text-center" style={{ backgroundColor: PAPER, borderColor: 'rgba(10,10,10,0.1)' }}>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
                Recommended Investment
              </p>
              <p className="text-4xl font-extrabold">
                {fmt(proposal.recommendedFee)}
              </p>
              <p className="mt-2 text-xs" style={{ color: EARTH }}>one-time project investment</p>
            </div>

            {!paid && (
              <div className="border p-8 text-center" style={{ backgroundColor: BLACK, borderColor: 'rgba(216,173,61,0.28)' }}>
                <p className="mb-2 text-sm font-semibold text-white/80">
                  Ready to build the Blueprint?
                </p>
                <p className="mb-6 text-sm leading-relaxed text-white/60">
                  Use the secure confirmation step to reserve the work and begin the guided implementation.
                </p>
                <a
                  href={`/commitment/${encodeURIComponent(proposal.proposalId)}`}
                  className="block w-full rounded-full px-6 py-4 text-xs font-bold uppercase tracking-widest text-black transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})` }}
                >
                  Let&apos;s Build Your Blueprint
                </a>
                <p className="mt-4 text-xs text-neutral-400">
                  Questions before you decide? Email us at{' '}
                  <a
                    href="mailto:freedom@efficiencyarchitects.online"
                    className="font-semibold text-neutral-200 underline"
                  >
                    freedom@efficiencyarchitects.online
                  </a>
                </p>
              </div>
            )}
          </>
        )}

        {!paymentReady && (
          <div className="border p-8 text-center" style={{ backgroundColor: PAPER, borderColor: 'rgba(10,10,10,0.1)' }}>
            <p className="mb-2 text-sm font-semibold">
              Questions about your results?
            </p>
            <p className="mb-6 text-sm leading-relaxed" style={{ color: EARTH }}>
              Email us and we will schedule a walkthrough of your Blueprint and recommended path.
            </p>
            <a
              href="mailto:freedom@efficiencyarchitects.online"
              className="inline-block rounded-full px-6 py-4 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90"
              style={{ backgroundColor: BLACK }}
            >
              Talk With Our Team
            </a>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-full border px-6 py-4 text-xs font-bold uppercase tracking-widest hover:bg-neutral-50"
              style={{ borderColor: 'rgba(10,10,10,0.18)', color: BLACK }}
            >
              Schedule a Call
            </a>
          </div>
        )}

        {paid && (
          <div className="border p-8" style={{ backgroundColor: PAPER, borderColor: 'rgba(10,10,10,0.1)' }}>
            <p
              className="mb-3 text-xs font-bold uppercase tracking-widest"
              style={{ color: GOLD }}
            >
              What Happens From Here
            </p>
            <p className="text-sm leading-relaxed" style={{ color: EARTH }}>
              Our team will reach out within one business day to schedule your kickoff
              call and walk you through the path ahead. Check your inbox for a
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
