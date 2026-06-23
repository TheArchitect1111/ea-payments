import Link from 'next/link';
import { listEACPLaunches } from '@/lib/eacp-launch';
import LaunchesClient from './LaunchesClient';

export const dynamic = 'force-dynamic';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

export default async function EACPLaunchesPage() {
  const launches = await listEACPLaunches();

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-neutral-900">
      <section className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
            EA Factory / EACP
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight" style={{ color: NAVY }}>
                Launches
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                Master orchestration for protocols, Project Briefs, Skin Briefs, repo recommendations, build packages, and approval queue handoff.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/ea-factory" className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200">
                EA Factory
              </Link>
              <Link href="/admin/protocol-center" className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200">
                Protocol Center
              </Link>
              <Link href="/admin/ea-factory/repo-library" className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200">
                Repo Library
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <LaunchesClient initialLaunches={launches} />
      </div>
    </main>
  );
}
