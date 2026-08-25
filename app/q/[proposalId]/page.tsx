import { notFound } from 'next/navigation';
import { getProposalByProposalId } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

const NAVY = '#17233B';
const GOLD = '#C9A844';
const CREAM = '#F6F4EF';

function fmt(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

const included = [
  { n: '01', icon: '▱', title: 'Website Experience', bullets: ['Custom premium presentation', 'Clear visitor journey and calls to action', 'Responsive across devices'] },
  { n: '02', icon: '▦', title: 'Client Portal', bullets: ['Private organized client destination', 'Resources, updates and next steps', 'Built around the client experience'] },
  { n: '03', icon: '✦', title: 'Eva Digital Assistant', bullets: ['24/7 digital guidance', 'Helps people navigate and find answers', 'Directs users toward the right next step'] },
  { n: '04', icon: '⌁', title: 'Smartchitecture', bullets: ['Connects the digital experience', 'Supports workflows and handoffs', 'Reduces unnecessary friction'] },
  { n: '05', icon: '▣', title: 'Mobile Optimization', bullets: ['Phone-first usability', 'Clean tablet and desktop experience', 'Consistent presentation everywhere'] },
  { n: '06', icon: '✓', title: 'Setup & Launch', bullets: ['Configuration and testing', 'Final review and launch preparation', 'Deployment of the completed experience'] },
];

const value = [
  { icon: '◎', title: 'Clearer Journey', text: 'Visitors know where to go and what to do next.' },
  { icon: '◇', title: 'Stronger Experience', text: 'A polished digital presence that feels intentional and credible.' },
  { icon: '↗', title: 'Less Friction', text: 'Information, resources and next steps are easier to access.' },
  { icon: '✦', title: '24/7 Guidance', text: 'Eva helps support the experience even when you are unavailable.' },
];

const steps = [
  ['01', 'Discovery & Content', 'We confirm priorities, content and the experience we are building.'],
  ['02', 'Build & Configure', 'We build the website, portal and supporting digital infrastructure.'],
  ['03', 'Review & Refine', 'You review the experience and we complete agreed refinements.'],
  ['04', 'Launch', 'Final testing is completed and the approved system goes live.'],
];

export default async function QuickQuoteClientPage({ params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await params;
  const proposal = await getProposalByProposalId(proposalId);
  if (!proposal || proposal.recommendedProjectType !== 'Quick Quote' || !['Approved', 'Sent'].includes(proposal.status)) notFound();

  const deposit = Math.min(Math.max(proposal.rawFee || 500, 0), proposal.recommendedFee);
  const balance = Math.max(proposal.recommendedFee - deposit, 0);
  const isWebsitePortal = /website/i.test(proposal.projectTypeLabel) && /portal/i.test(proposal.projectTypeLabel);

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-8" style={{ backgroundColor: CREAM, color: NAVY }}>
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-[#E5E0D5] bg-white shadow-[0_20px_70px_rgba(23,35,59,0.10)]">
        <header className="relative overflow-hidden px-6 py-8 text-white sm:px-10 sm:py-11" style={{ backgroundColor: NAVY }}>
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full border border-white/10" />
          <div className="absolute -right-6 -top-6 h-36 w-36 rounded-full border border-white/10" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <img src="/images/ea-logo.png" alt="Efficiency Architects" className="h-14 w-auto sm:h-16" />
              <div className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">Quick Quote · {proposal.proposalId}</div>
            </div>
            <p className="mt-10 text-xs font-black uppercase tracking-[0.22em]" style={{ color: GOLD }}>Prepared for {proposal.businessName}</p>
            <h1 className="mt-3 max-w-xl text-4xl font-black leading-[1.03] sm:text-5xl">Your vision.<br />Built smarter.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70">A connected {proposal.projectTypeLabel.toLowerCase()} experience designed to make your business easier to understand, easier to navigate, and easier to work with.</p>
            <div className="mt-7 inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em]" style={{ backgroundColor: GOLD, color: NAVY }}>{proposal.projectTypeLabel}</div>
          </div>
        </header>

        <section className="px-6 py-8 sm:px-10">
          <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: GOLD }}>The project</p>
          <h2 className="mt-3 text-2xl font-black sm:text-3xl">More than pages. A working digital experience.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">We are creating a connected system that gives your public audience a stronger first impression while giving clients a clearer, more organized experience behind the scenes.</p>
        </section>

        {isWebsitePortal && <section className="border-y border-[#ECE8DF] bg-[#FAF9F6] px-6 py-8 sm:px-10">
          <div className="text-center"><p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: GOLD }}>What’s included</p><h2 className="mt-2 text-2xl font-black">Your project, clearly defined.</h2></div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {included.map((item) => <div key={item.n} className="rounded-[24px] border border-[#E8E3D9] bg-white p-5 shadow-[0_8px_30px_rgba(23,35,59,0.05)]">
              <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-black" style={{ backgroundColor: NAVY, color: GOLD }}>{item.icon}</div><div><p className="text-[10px] font-black tracking-[0.16em] text-neutral-400">{item.n}</p><h3 className="text-base font-black">{item.title}</h3></div></div>
              <div className="mt-4 border-t border-[#EEEAE2] pt-3">{item.bullets.map((b) => <p key={b} className="mt-2 flex gap-2 text-sm leading-6 text-neutral-600"><span style={{ color: GOLD }}>✓</span><span>{b}</span></p>)}</div>
            </div>)}
          </div>
        </section>}

        <section className="px-6 py-8 sm:px-10">
          <div className="text-center"><p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: GOLD }}>What this does for you</p><h2 className="mt-2 text-2xl font-black">Designed around the experience.</h2></div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">{value.map((item) => <div key={item.title} className="rounded-[20px] border border-[#E8E3D9] p-4 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#F4EEDB] font-black" style={{ color: NAVY }}>{item.icon}</div><h3 className="mt-3 text-sm font-black">{item.title}</h3><p className="mt-2 text-xs leading-5 text-neutral-500">{item.text}</p></div>)}</div>
        </section>

        <section className="mx-4 rounded-[26px] px-6 py-7 text-white sm:mx-8 sm:px-8" style={{ backgroundColor: NAVY }}>
          <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: GOLD }}>Project scope</p>
          <div className="mt-4 whitespace-pre-line text-sm leading-7 text-white/75">{proposal.scopeSummary}</div>
        </section>

        <section className="px-6 py-8 sm:px-10">
          <p className="text-center text-xs font-black uppercase tracking-[0.2em]" style={{ color: GOLD }}>How we get there</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">{steps.map(([n,title,text]) => <div key={n} className="relative rounded-[20px] bg-[#FAF9F6] p-4"><div className="text-2xl font-black text-[#DDD6C7]">{n}</div><h3 className="mt-2 text-sm font-black">{title}</h3><p className="mt-2 text-xs leading-5 text-neutral-500">{text}</p></div>)}</div>
        </section>

        <section className="border-y border-[#ECE8DF] bg-[#FAF9F6] px-6 py-8 sm:px-10">
          <div className="grid gap-5 sm:grid-cols-[1.2fr_.8fr]">
            <div><p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: GOLD }}>Investment</p><div className="mt-3 flex items-end gap-3"><p className="text-5xl font-black">{fmt(proposal.recommendedFee)}</p><p className="pb-1 text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">Total project</p></div><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-white px-3 py-2 text-xs font-bold">{fmt(deposit)} deposit</span>{balance > 0 && <span className="rounded-full bg-white px-3 py-2 text-xs font-bold">{fmt(balance)} before launch</span>}<span className="rounded-full bg-white px-3 py-2 text-xs font-bold">2–4 week target</span></div></div>
            <div className="rounded-[22px] border border-[#E8E3D9] bg-white p-5"><p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">To begin</p><p className="mt-2 text-3xl font-black" style={{ color: GOLD }}>{fmt(deposit)}</p><p className="mt-2 text-xs leading-5 text-neutral-500">Secures the project and moves it into discovery and launch preparation.</p></div>
          </div>
        </section>

        <section className="px-6 py-8 sm:px-10">
          <div className="rounded-[26px] p-6 text-center text-white sm:p-8" style={{ backgroundColor: NAVY }}><p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: GOLD }}>Ready when you are</p><h2 className="mt-3 text-2xl font-black">Review the agreement and secure your project.</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/65">The next screen contains the project agreement. Payment is processed only after you review and accept it.</p><a href={`/commitment/${encodeURIComponent(proposal.proposalId)}`} className="mt-6 block w-full rounded-full px-5 py-4 text-center text-sm font-black uppercase tracking-[0.14em]" style={{ backgroundColor: GOLD, color: NAVY }}>Review Agreement & Start</a></div>
        </section>

        <footer className="border-t border-[#ECE8DF] px-6 py-6 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">Efficiency Architects · Guided by purpose. Built for progress.</footer>
      </div>
    </main>
  );
}
