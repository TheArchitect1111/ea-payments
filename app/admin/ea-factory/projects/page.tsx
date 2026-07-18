import { NAVY, GOLD } from '@/lib/design-system';
import Link from 'next/link';
import AdminLogin from '../../master/AdminLogin';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';
import { listFactoryProjects } from '@/lib/factory-project-store';
import { FACTORY_WORKERS } from '@/lib/factory-workers';
import ProjectsClient from './ProjectsClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FactoryProjectsPage({ searchParams }: PageProps) {
  if (!(await hasAdminPageAccess())) return <AdminLogin />;

  const params = (await searchParams) ?? {};
  const focusRaw = params.focus;
  const focus = Array.isArray(focusRaw) ? focusRaw[0] : focusRaw;
  const projects = await listFactoryProjects();
  const focused = focus ? projects.find((p) => p.id === focus) : undefined;
  const implemented = FACTORY_WORKERS.filter((w) => w.implemented);

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-neutral-900">
      <section className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
            EA Factory / Runtime
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight" style={{ color: NAVY }}>
                Projects
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                Factory pipeline: intake → research → discovery → planning → building. After Launch,
                open a project to see status and activity. Human approval still comes before publish.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/ea-factory/launch"
                className="rounded-full bg-[#1B2B4D] px-4 py-2 text-xs font-bold text-white"
              >
                New Launch
              </Link>
              <Link
                href="/admin/ea-factory"
                className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200"
              >
                EA Factory
              </Link>
              <Link
                href="/admin/ea-factory/launches"
                className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200"
              >
                EACP Launches
              </Link>
              <Link
                href="/api/health/factory-queue"
                className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200"
              >
                Queue health
              </Link>
            </div>
          </div>
          <p className="mt-4 text-xs text-neutral-500">
            Active workers: {implemented.map((w) => w.label).join(', ') || 'none'} · Deferred:{' '}
            {FACTORY_WORKERS.filter((w) => !w.implemented)
              .map((w) => w.id)
              .join(', ')}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        {focused ? (
          <section className="border border-neutral-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
              Activity
            </p>
            <h2 className="mt-2 text-xl font-black" style={{ color: NAVY }}>
              {focused.client}
            </h2>
            <p className="mt-1 font-mono text-xs text-neutral-400">{focused.id}</p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              {focused.activity
                .slice()
                .reverse()
                .map((item, index) => (
                  <li key={`${item.at}-${index}`} className="border-l-2 border-[#C9A844] pl-3">
                    <span className="font-semibold text-neutral-800">
                      {item.from ?? '—'} → {item.to}
                    </span>{' '}
                    <span className="text-neutral-400">({item.worker})</span>
                    {item.detail ? <div className="text-neutral-500">{item.detail}</div> : null}
                    <div className="text-[11px] text-neutral-400">{new Date(item.at).toLocaleString()}</div>
                  </li>
                ))}
            </ul>
          </section>
        ) : null}

        <ProjectsClient initialProjects={projects} />
      </div>
    </main>
  );
}
