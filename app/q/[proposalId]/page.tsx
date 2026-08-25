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

const websitePortalValue = [
  { icon: '◫', title: 'Website Experience', text: 'A polished, mobile-first digital presence built to clearly communicate who you are, what you offer, and what visitors should do next.' },
  { icon: '▦', title: 'Client Portal', text: 'A private, organized destination that gives clients a better way to access information, resources, updates, and next steps.' },
  { icon: '✦', title: 'Eva Digital Assistant', text: 'A 24/7 digital guide designed to help visitors and clients navigate the experience, find answers, and move toward the right action.' },
  { icon: '⌁', title: 'Smartchitecture', text: 'The intelligence layer connecting the website, portal, workflows, and client journey so the experience works as one system.' },
  { icon: '▣', title: 'Mobile Optimization', text: 'Designed around how people actually browse today, with a clean experience across phones, tablets, and desktop screens.' },
  { icon: '✓', title: 'Setup & Launch', text: 'Configuration, testing, launch preparation, and final deployment so the finished system is ready to use.' },
];

export default async function QuickQuoteClientPage({ params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await params;
  const proposal = await getProposalByProposalId(proposalId);

  if (!proposal || proposal.recommendedProjectType !== 'Quick Quote' || !['Approved', 'Sent'].includes(proposal.status)) {
    notFound();
  }

  const deposit = Math.min(Math.max(proposal.rawFee || 500, 0), proposal.recommendedFee);
  const isWebsitePortal = /website/i.test(proposal.projectTypeLabel) && /portal/i.test(proposal.projectTypeLabel);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6" style={{ backgroundColor: CREAM, color: NAVY }}>
      <div className="mx-auto max-w-2xl">
        <header className="rounded-[28px] px-6 py-7 text-white sm:px-8" style={{ backgroundColor: NAVY }}>
          <img src="/images/ea-logo.png" alt="Efficiency Architects" className="h-16 w-auto" />
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>Your Project</p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">{proposal.projectTypeLabel}</h1>
          <p className="mt-3 text-sm text-white/70">Prepared for {proposal.businessName}</p>
        </header>

        <section className="mt-4 rounded-[28px] border border-[#E1DDD3] bg-white p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: GOLD }}>What we are building</p>
          <h2 className="mt-3 text-2xl font-black leading-tight">More than a website. A working digital experience.</h2>
          <p className="mt-4 text-sm leading-7 text-neutral-600">
            The goal is not simply to put information online. We are building a connected experience that helps people understand your business, take the right next step, and interact with you more efficiently.
          </p>
        </section>

        {isWebsitePortal && (
          <section className="mt-4 rounded-[28px] border border-[#E1DDD3] bg-white p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: GOLD }}>Your project includes</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {websitePortalValue.map((item) => (
                <div key={item.title} className="rounded-[22px] border border-[#ECE8DF] bg-[#FAF9F6] p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-black" style={{ backgroundColor: '#F1E9CF', color: NAVY }}>{item.icon}</div>
                  <h3 className="mt-4 text-base font-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-4 rounded-[28px] border border-[#E1DDD3] bg-white p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: GOLD }}>Project scope</p>
          <div className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-700">{proposal.scopeSummary}</div>
        </section>

        <section className="mt-4 rounded-[28px] px-6 py-7 text-white sm:px-8" style={{ backgroundColor: NAVY }}>
          <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: GOLD }}>The outcome</p>
          <h2 className="mt-3 text-2xl font-black">One connected system working for your business.</h2>
          <p className="mt-3 text-sm leading-7 text-white/75">A stronger public presence, a better client experience, clearer next steps, and digital infrastructure designed to reduce friction instead of creating more work.</p>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[24px] border border-[#E1DDD3] bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Project investment</p>
            <p className="mt-2 text-3xl font-black">{fmt(proposal.recommendedFee)}</p>
          </div>
          <div className="rounded-[24px] border border-[#E1DDD3] bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Deposit to begin</p>
            <p className="mt-2 text-3xl font-black">{fmt(deposit)}</p>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] p-6 text-white sm:p-8" style={{ backgroundColor: NAVY }}>
          <p className="text-sm leading-7 text-white/75">Ready to move forward? The next screen contains the project agreement. After acceptance, you can securely submit the deposit and your project moves into launch preparation.</p>
          <a href={`/commitment/${encodeURIComponent(proposal.proposalId)}`} className="mt-5 block w-full rounded-full px-5 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-[#17233B]" style={{ backgroundColor: GOLD }}>
            Review Agreement & Start
          </a>
        </section>

        <p className="px-4 py-7 text-center text-xs text-neutral-500">Efficiency Architects · Quote {proposal.proposalId}</p>
      </div>
    </main>
  );
}
