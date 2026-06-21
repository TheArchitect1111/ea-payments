import Link from 'next/link';
import {
  ALL_MAGNIFI_TEMPLATE_IDS,
  ALL_SIMPLIFI_ASSESSMENT_IDS,
  getMagnifiTemplate,
  getSimplifiAssessment,
} from '@/lib/ea-template-registry';

export const dynamic = 'force-dynamic';

export default function ExperienceTemplatesPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F3]">
      <section className="bg-[#1B2B4D] px-6 py-16 text-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#C9A844]">Phase 2 Templates</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black">Simplifi + Magnifi Template Library</h1>
          <p className="mt-4 text-lg text-white/75 max-w-3xl">
            Ten paired experiences — each Simplifi guidance assessment routes to a Magnifi cinematic template with
            its own visual theme.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <div>
          <h2 className="text-2xl font-extrabold text-[#1B2B4D]">Magnifi cinematic templates</h2>
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            {ALL_MAGNIFI_TEMPLATE_IDS.map((id) => {
              const t = getMagnifiTemplate(id);
              const s = getSimplifiAssessment(t.pairedSimplifiAssessment);
              return (
                <article
                  key={id}
                  className="border border-neutral-200 p-5"
                  style={{ borderTopWidth: 4, borderTopColor: t.theme.accent }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">{t.audience}</p>
                  <h3 className="mt-2 text-lg font-bold text-[#1B2B4D]">{t.name}</h3>
                  {t.example && <p className="text-sm text-neutral-500">Example: {t.example}</p>}
                  <p className="mt-3 text-sm text-neutral-600">{t.journey.join(' → ')}</p>
                  <p className="mt-3 text-xs text-neutral-500">Paired: {s.name}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-[#1B2B4D]">Simplifi guidance assessments</h2>
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            {ALL_SIMPLIFI_ASSESSMENT_IDS.map((id) => {
              const s = getSimplifiAssessment(id);
              const m = getMagnifiTemplate(s.pairedMagnifiTemplate);
              return (
                <article key={id} className="bg-white border border-neutral-200 p-5">
                  <h3 className="text-lg font-bold text-[#1B2B4D]">{s.name}</h3>
                  <p className="mt-2 text-sm text-neutral-600">{s.scope}</p>
                  <p className="mt-3 text-xs text-neutral-500">Magnifi: {m.name}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="border border-neutral-200 bg-white p-6">
          <p className="text-sm text-neutral-600">
            Capture any URL in{' '}
            <Link href="/portal/login" className="font-semibold underline text-[#1B2B4D]">
              portal Simplifi
            </Link>{' '}
            or{' '}
            <Link href="/admin/simplifi" className="font-semibold underline text-[#1B2B4D]">
              admin Simplifi
            </Link>{' '}
            — the engine selects the best template from page signals.
          </p>
        </div>
      </section>
    </main>
  );
}
