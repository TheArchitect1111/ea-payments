import Link from 'next/link';
import { parseBlueprintSummary } from '@/lib/blueprint-summary';
import type { CaptureRecord } from '@/lib/capture-records';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';
const CREAM = '#FAF8F3';

export default function MagnifiClassicReport({ capture }: { capture: CaptureRecord }) {
  const summaryText = capture.blueprintSummary || capture.analysisSummary;
  const parsed = parseBlueprintSummary(summaryText);
  const hasStructured = parsed.sections.length > 0;

  return (
    <main style={{ backgroundColor: CREAM }} className="min-h-screen">
      <section className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: GOLD }}>
            Magnifi&trade; Classic Report
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight" style={{ color: NAVY }}>
            {capture.title}
          </h1>
          <Link href={`/magnifi/${capture.id}`} className="text-xs underline mt-4 inline-block" style={{ color: GOLD }}>
            ← Cinematic experience
          </Link>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-10 grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          {!hasStructured ? (
            <article className="bg-white border border-neutral-200 p-6">
              <p className="text-sm text-neutral-500">Summary is being prepared.</p>
            </article>
          ) : (
            parsed.sections.map((section) => (
              <article key={section.title} className="bg-white border border-neutral-200 p-6">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GOLD }}>
                  {section.title}
                </p>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">{section.content}</p>
              </article>
            ))
          )}
        </div>
        <aside className="bg-white border border-neutral-200 p-5 h-fit space-y-4">
          {parsed.roadmap.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: GOLD }}>
                Roadmap
              </p>
              <ul className="space-y-3">
                {parsed.roadmap.map((item) => (
                  <li key={item.phase} className="text-sm">
                    <p className="font-bold" style={{ color: NAVY }}>
                      {item.phase}
                    </p>
                    <p className="text-neutral-600 mt-0.5">{item.focus}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
