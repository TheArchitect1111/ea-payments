import { NAVY, GOLD } from '@/lib/design-system';
import Link from 'next/link';
import AdminLogin from '../../master/AdminLogin';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';
import { listExperienceDirectorDashboardRows } from '@/lib/factory-experience-director';
import ExperienceDirectorClient from './ExperienceDirectorClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExperienceDirectorPage({ searchParams }: PageProps) {
  if (!(await hasAdminPageAccess())) return <AdminLogin />;

  const params = (await searchParams) ?? {};
  const focusRaw = params.projectId ?? params.focus;
  const focus = Array.isArray(focusRaw) ? focusRaw[0] : focusRaw;
  const rows = await listExperienceDirectorDashboardRows();

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-neutral-900">
      <section className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
            EA Factory / Experience Director
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight" style={{ color: NAVY }}>
                Experience Director
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                Creative Director gate for Factory experiences. Evaluates craftsmanship against the
                EA Experience Constitution. Never generates or deploys — publish is allowed only when
                the latest review status is Approved.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/ea-factory/experience-director/calibration"
                className="rounded-full bg-[#C9A844] px-4 py-2 text-xs font-black text-[#1B2B4D]"
              >
                Calibration
              </Link>
              <Link
                href="/admin/ea-factory/experience-director/validation"
                className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200"
              >
                Validation Mode
              </Link>
              <Link
                href="/admin/ea-factory/projects"
                className="rounded-full bg-[#1B2B4D] px-4 py-2 text-xs font-bold text-white"
              >
                Projects
              </Link>
              <Link
                href="/admin/ea-factory"
                className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200"
              >
                EA Factory
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <ExperienceDirectorClient initialRows={rows} initialFocusId={focus} />
      </div>
    </main>
  );
}
