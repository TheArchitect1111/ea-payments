import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCaptureByIdentifier } from '@/lib/capture-records';
import { parseBlueprintSummary } from '@/lib/blueprint-summary';

export const dynamic = 'force-dynamic';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';
const CREAM = '#FAF8F3';

export default async function MagnifiOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const capture = await getCaptureByIdentifier(id);

  if (!capture) {
    notFound();
  }

  const summaryText = capture.blueprintSummary || capture.analysisSummary;
  const parsed = parseBlueprintSummary(summaryText);
  const hasStructured = parsed.sections.length > 0;

  return (
    <main style={{ backgroundColor: CREAM }} className="min-h-screen">
      <section className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: GOLD }}>
            Magnifi&trade; Opportunity Experience
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight" style={{ color: NAVY }}>
            {capture.title}
          </h1>
          {parsed.meta[0] && (
            <p className="text-sm font-semibold mt-3" style={{ color: NAVY }}>
              {parsed.meta[0]}
            </p>
          )}
          {parsed.meta[1] && <p className="text-lg text-neutral-700 mt-1">{parsed.meta[1]}</p>}
          {parsed.meta[2] && <p className="text-sm text-neutral-500 mt-1">{parsed.meta[2]}</p>}
          <p className="text-sm text-neutral-500 mt-4 max-w-3xl">
            Generated from a Simplifi capture and routed through the EA opportunity intelligence
            stack.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            <Metric label="Opportunity" value={capture.opportunityScore ?? 'Pending'} />
            <Metric label="EA Fit" value={capture.eaFitScore ?? 'Pending'} />
            <Metric label="Trust" value={capture.trustConfidence ?? 'Pending'} />
            <Metric label="Status" value={capture.status} />
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-10 grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          {!hasStructured ? (
            <article className="bg-white border border-neutral-200 p-6">
              <h2 className="text-xl font-extrabold" style={{ color: NAVY }}>
                Opportunity summary is being prepared
              </h2>
              <p className="text-sm text-neutral-500 mt-2">
                This record exists, but the Magnifi summary has not been generated yet. Return after
                Simplifi finishes analysis, or contact your advisor.
              </p>
            </article>
          ) : (
            parsed.sections.map((section) => (
              <article key={section.title} className="bg-white border border-neutral-200 p-6">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GOLD }}>
                  {section.title}
                </p>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                  {section.content}
                </p>
              </article>
            ))
          )}
        </div>

        <aside className="bg-white border border-neutral-200 p-5 h-fit space-y-5">
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
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
              Source
            </p>
            {capture.sourceUrl ? (
              <a
                href={capture.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline break-all"
                style={{ color: NAVY }}
              >
                {capture.sourceUrl}
              </a>
            ) : (
              <p className="text-sm text-neutral-500">Manual capture</p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
              Template
            </p>
            <p className="text-sm text-neutral-700">{capture.blueprintTemplate ?? 'Not selected'}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
              Product Alignment
            </p>
            <p className="text-sm text-neutral-700">
              {(capture.productAlignment ?? ['Simplifi', 'Clarifi', 'Magnifi', 'Pulse']).join(', ')}
            </p>
          </div>
          <Link
            href="/simplifi"
            className="inline-block text-xs font-bold underline"
            style={{ color: GOLD }}
          >
            Learn about Simplifi →
          </Link>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4" style={{ backgroundColor: CREAM, borderTop: `3px solid ${GOLD}` }}>
      <p className="text-2xl font-extrabold" style={{ color: NAVY }}>
        {value}
      </p>
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p>
    </div>
  );
}
