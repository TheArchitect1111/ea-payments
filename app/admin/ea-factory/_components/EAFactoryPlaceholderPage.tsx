import Link from 'next/link';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

export default function EAFactoryPlaceholderPage({ title, purpose }: { title: string; purpose: string }) {
  return (
    <main className="min-h-screen bg-[#FAF8F3] px-6 py-10 text-neutral-900">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/ea-factory" className="text-sm font-bold" style={{ color: GOLD }}>
          Back to EA Factory
        </Link>
        <section className="mt-5 border border-dashed border-neutral-300 bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            Future Placeholder
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight" style={{ color: NAVY }}>
            {title}&trade;
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">{purpose}</p>
          <p className="mt-5 border-l-4 border-[#C9A844] bg-[#FAF8F3] p-4 text-sm leading-7 text-neutral-700">
            Placeholder only. No functionality, agents, autonomous decisions, or deployment actions are built here yet.
          </p>
        </section>
      </div>
    </main>
  );
}
