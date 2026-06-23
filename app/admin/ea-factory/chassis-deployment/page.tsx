import Link from 'next/link';
import { listEACPLaunches } from '@/lib/eacp-launch';

export const dynamic = 'force-dynamic';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

export default async function ChassisDeploymentPage() {
  const launches = await listEACPLaunches();
  const packages = launches.filter((launch) => launch.deploymentPackage);

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-neutral-900">
      <section className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
            EA Factory / Chassis Deployment
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight" style={{ color: NAVY }}>
            Deployment Packages
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
            Approved EACP launches create export-ready deployment packages. This phase prepares packages only; it does not auto-deploy.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {packages.length === 0 ? (
          <div className="border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-500">
            No deployment packages are ready yet.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {packages.map((launch) => (
              <article key={launch.id} className="border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
                  {launch.deploymentPackage?.status}
                </p>
                <h2 className="mt-2 text-2xl font-black" style={{ color: NAVY }}>
                  {launch.client}
                </h2>
                <p className="mt-2 text-sm text-neutral-500">{launch.goal} / {launch.deliverable}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/admin/ea-factory/launches/${launch.id}`} className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
                    Review
                  </Link>
                  <a href={`/api/ea-factory/launch/${launch.id}/export?type=json`} className="bg-[#C9A844] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1B2B4D]">
                    JSON
                  </a>
                  <a href={`/api/ea-factory/launch/${launch.id}/export?type=markdown`} className="bg-[#C9A844] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1B2B4D]">
                    Markdown
                  </a>
                  <a href={`/api/ea-factory/launch/${launch.id}/export?type=codex`} className="bg-[#C9A844] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1B2B4D]">
                    Codex
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
