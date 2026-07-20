import { NAVY, GOLD } from '@/lib/design-system';
import Link from 'next/link';
import AdminLogin from '../../../master/AdminLogin';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';
import { getExperienceDirectorValidationAnalytics } from '@/lib/factory-experience-director-validation';
import ValidationModeClient from './ValidationModeClient';

export const dynamic = 'force-dynamic';

export default async function ExperienceDirectorValidationPage() {
  if (!(await hasAdminPageAccess())) return <AdminLogin />;

  const analytics = await getExperienceDirectorValidationAnalytics();

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-neutral-900">
      <section className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
            EA Factory / Experience Director / Validation Mode
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight" style={{ color: NAVY }}>
                Validation Framework
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                Phase 1 — improve Experience Director quality before automation. Capture scores,
                rationale, improvements, reviewer, and blueprint version. Compare reviews across
                projects. Publishing behavior is unchanged.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/ea-factory/experience-director"
                className="rounded-full bg-[#1B2B4D] px-4 py-2 text-xs font-bold text-white"
              >
                Experience Director
              </Link>
              <Link
                href="/admin/ea-factory/experience-director/calibration"
                className="rounded-full bg-[#C9A844] px-4 py-2 text-xs font-black text-[#1B2B4D]"
              >
                Calibration
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
        <ValidationModeClient initialAnalytics={analytics} />
      </div>
    </main>
  );
}
