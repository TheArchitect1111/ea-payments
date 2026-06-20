import Link from 'next/link';

export default function ScorecardPage() {
  return (
    <main className="min-h-screen bg-[#F8F6F2] text-[#111827]">
      <header className="border-b border-[#1B2B4D]/10 bg-[#1B2B4D] px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-xs font-black uppercase tracking-[0.2em] text-[#C9A844]">
            Efficiency Architects
          </Link>
          <Link href="/assessment" className="text-xs font-bold uppercase tracking-[0.14em] text-white/80 hover:text-white">
            Operational MRI →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#C9A844]">Free Lead Magnet</p>
        <h1 className="mt-4 text-4xl font-black text-[#1B2B4D]">Visibility Assessment Scorecard</h1>
        <p className="mt-5 text-base leading-8 text-slate-600">
          Identify where work, risks, ownership, updates, and decisions are becoming invisible inside your business.
          Score five visibility domains and get a practical read on your operating blind spots.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a
            href="/downloads/visibility-assessment-scorecard.docx"
            className="inline-flex rounded-sm bg-[#C9A844] px-6 py-4 text-center text-xs font-black uppercase tracking-[0.18em] text-[#1B2B4D]"
          >
            Download Scorecard
          </a>
          <Link
            href="/assessment"
            className="inline-flex rounded-sm border border-[#1B2B4D]/20 px-6 py-4 text-center text-xs font-black uppercase tracking-[0.18em] text-[#1B2B4D]"
          >
            Take The Operational MRI
          </Link>
        </div>
      </div>
    </main>
  );
}
