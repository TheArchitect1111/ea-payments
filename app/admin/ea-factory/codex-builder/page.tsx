import { NAVY, GOLD } from '@/lib/design-system';
import Link from 'next/link';
import AdminLogin from '../../master/AdminLogin';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';
import { listEACPCodexHandoffs } from '@/lib/eacp-launch';

export const dynamic = 'force-dynamic';

export default async function CodexBuilderPage() {
  if (!(await hasAdminPageAccess())) return <AdminLogin />;
  const handoffs = await listEACPCodexHandoffs();

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-neutral-900">
      <section className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
            EA Factory / Codex Builder
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight" style={{ color: NAVY }}>
            Approved Build Handoffs
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
            Approved EACP packages are converted into Codex-ready handoff records. Phase 2 prepares the package; Phase 3 executes it.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {handoffs.length === 0 ? (
          <div className="border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-500">
            No approved Codex handoff packages are ready yet.
          </div>
        ) : (
          <div className="grid gap-5">
            {handoffs.map((handoff) => (
              <article key={handoff.id} className="border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
                      Ready For Codex
                    </p>
                    <h2 className="mt-2 text-2xl font-black" style={{ color: NAVY }}>
                      {handoff.client}
                    </h2>
                    <p className="mt-2 text-sm text-neutral-500">{handoff.goal} / {handoff.deliverable}</p>
                  </div>
                  <Link href={`/admin/ea-factory/launches/${handoff.launchId}`} className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
                    Review Package
                  </Link>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <Brief title="Approved Repos" items={handoff.approvedRepoSet.map((repo) => repo.name)} />
                  <Brief title="Modules" items={handoff.recommendedModules} />
                  <Brief title="Build Checklist" items={handoff.buildChecklist} />
                </div>
                <textarea readOnly value={handoff.codexBuildPrompt} className="mt-5 h-72 w-full border border-neutral-200 bg-[#FAF8F3] p-4 text-sm leading-6" />
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Brief({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-[#FAF8F3] p-4">
      <h3 className="text-sm font-black" style={{ color: NAVY }}>{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
