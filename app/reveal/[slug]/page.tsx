import { notFound } from 'next/navigation';
import { getClientByPortalSlug } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';
const CALENDLY_URL = process.env.CALENDLY_URL ?? 'https://calendly.com/freedom-efficiencyarchitects/30min';

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export default async function RevealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await getClientByPortalSlug(slug);
  if (!client) notFound();

  const deliverables = [
    'Your client portal is ready',
    'Your core operating structure is in place',
    'Your training and next steps are prepared',
  ];

  return (
    <main className="min-h-screen bg-[#1B2B4D] text-white">
      <section className="mx-auto max-w-5xl px-6 py-8">
        <img src="/images/ea-logo.png" alt="Efficiency Architects" className="h-20 w-auto" />
        <div className="py-12">
          <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            {client.organization || client.clientName}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black uppercase tracking-wide sm:text-6xl" style={{ color: GOLD }}>
            Welcome to your new operating system.
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="border border-white/15 bg-white/8 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: GOLD }}>What We Built</p>
            <ul className="mt-5 space-y-3">
              {deliverables.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-7 text-blue-50">
                  <span style={{ color: GOLD }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-white/15 bg-white/8 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: GOLD }}>Impact</p>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-3xl font-black" style={{ color: GOLD }}>Ready</p>
                <p className="text-xs uppercase tracking-wider text-blue-100">Portal Access</p>
              </div>
              <div>
                <p className="text-3xl font-black" style={{ color: GOLD }}>{fmt(client.amountPaid || 0)}</p>
                <p className="text-xs uppercase tracking-wider text-blue-100">Project Investment Confirmed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href={`/portal/${slug}`} className="px-6 py-4 text-xs font-black uppercase tracking-[0.2em]" style={{ backgroundColor: GOLD, color: NAVY }}>
            Enter Your Portal
          </a>
          <a href={CALENDLY_URL} className="border border-white/40 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white">
            Book Your Onboarding Call
          </a>
        </div>
      </section>
    </main>
  );
}
