import Link from 'next/link';
import AdminLogin from '../../master/AdminLogin';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';
import { listTrainingTransformations } from '@/lib/training-transformation-store';
import TrainingTransformationsClient from './TrainingTransformationsClient';

export const dynamic = 'force-dynamic';

export default async function TrainingTransformationsPage() {
  if (!(await hasAdminPageAccess())) return <AdminLogin />;

  const records = await listTrainingTransformations();

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin/ea-factory" className="text-sm font-bold text-[#f2c94c]">
          Back to EA Factory
        </Link>
        <section className="mt-6 border border-[#4d3b11] bg-[#111] p-6 shadow-[0_0_60px_rgba(242,201,76,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f2c94c]">EA Intelligence</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight">Training Transformation Queue</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-300">
                Review generated lessons, quizzes, checklists, knowledge-base drafts, and manager summaries before publishing to Training Hub, Client Portal, and Pulse.
              </p>
            </div>
            <Link href="/admin/ea-factory/new-experience" className="rounded-full bg-[#f2c94c] px-4 py-2 text-xs font-black uppercase tracking-wider text-black">
              New Experience
            </Link>
          </div>
        </section>

        <TrainingTransformationsClient initialRecords={records} />
      </div>
    </main>
  );
}
