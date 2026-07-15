import Link from 'next/link';
import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import {
  FACTORY_STAGES,
  getFactoryStageSummary,
  getFactoryStatusSummary,
  listFactoryOutputs,
  resolveFactoryStage,
  type FactoryOutputStatus,
} from '@/lib/executive-factory';
import { CREAM, GOLD, NAVY } from '@/lib/design-system';

export const dynamic = 'force-dynamic';

const OPPORTUNITY_PROMPTS = [
  { label: 'A new client', href: '/admin/factory/operational-mri' },
  { label: 'A nonprofit', href: '/consider/selena' },
  { label: 'A sports organization', href: '/admin/ea-factory/launches' },
  { label: 'A school', href: '/admin/ea-factory/launches' },
  { label: 'A conference', href: '/admin/ea-factory/launches' },
  { label: 'A fundraiser', href: '/admin/ea-factory/launches' },
  { label: 'A business transformation', href: '/assessment' },
  { label: 'A marketing campaign', href: '/admin/products/amplifi' },
  { label: 'A training program', href: '/admin/academy' },
  { label: 'Something else', href: '/admin/search', dashed: true },
] as const;

function statusTone(status: FactoryOutputStatus): string {
  if (status === 'Live') return '#166534';
  if (status === 'Partial') return '#92400e';
  return '#737373';
}

export default async function ExecutiveFactoryPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    redirectToAdminLogin('/admin/factory');
  }

  const params = await searchParams;
  const activeStage = resolveFactoryStage(params.stage);

  const outputs = listFactoryOutputs(activeStage ? { stage: activeStage } : undefined);
  const stageSummary = getFactoryStageSummary();
  const statusSummary = getFactoryStatusSummary();

  function hrefFor(stage?: string) {
    if (!stage) return '/admin/factory';
    return `/admin/factory?stage=${encodeURIComponent(stage)}`;
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            Executive Factory™
          </p>
          <h1 className="mt-2 text-3xl font-black" style={{ color: NAVY }}>
            What are we trying to accomplish?
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-600">
            Start here for every new opportunity. Executive Factory routes you to existing EA workflows —
            it does not replace them. Search first in Universal Search when you need to find what already
            exists.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-widest">
            <Link href="/admin/master" className="text-neutral-500 hover:text-neutral-900">
              Executive Briefing
            </Link>
            <Link href="/admin/search" className="text-neutral-500 hover:text-neutral-900">
              Universal Search
            </Link>
            <Link href="/admin/knowledge" className="text-neutral-500 hover:text-neutral-900">
              Knowledge Center
            </Link>
            <Link href="/admin/atlas" className="text-neutral-500 hover:text-neutral-900">
              Atlas
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <section className="border border-neutral-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Begin with the opportunity
          </p>
          <p className="mt-2 text-sm text-neutral-600">What are we working on today?</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {OPPORTUNITY_PROMPTS.map((prompt) => (
              <Link
                key={prompt.label}
                href={prompt.href}
                className={
                  'dashed' in prompt && prompt.dashed
                    ? 'border border-dashed border-neutral-300 px-3 py-1 text-[11px] text-neutral-500 transition hover:border-neutral-500 hover:text-neutral-800'
                    : 'border border-neutral-200 px-3 py-1 text-[11px] font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900'
                }
              >
                {prompt.label}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-sm text-neutral-600" style={{ backgroundColor: CREAM }}>
            Choose a chip to open the matching workflow, or pick a stage below to browse all outputs.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stageSummary.map((item) => (
            <Link
              key={item.stage}
              href={hrefFor(item.stage)}
              className="border border-neutral-200 bg-white p-4 transition hover:border-neutral-400"
              style={{
                borderColor: activeStage === item.stage ? NAVY : undefined,
              }}
            >
              <p className="text-2xl font-black" style={{ color: NAVY }}>
                {item.count}
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                {item.stage}
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{item.purpose}</p>
            </Link>
          ))}
        </section>

        <section className="border border-neutral-200 bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
                {activeStage ? `${activeStage} outputs` : 'All outputs'}
              </p>
              <p className="mt-1 text-sm text-neutral-600">{outputs.length} workflow(s) in view</p>
            </div>
            {activeStage ? (
              <Link
                href="/admin/factory"
                className="text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-neutral-900"
              >
                All stages
              </Link>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/factory"
              className="border px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
              style={{
                borderColor: !activeStage ? NAVY : '#e5e5e5',
                color: !activeStage ? NAVY : '#737373',
              }}
            >
              All stages
            </Link>
            {FACTORY_STAGES.map((stage) => (
              <Link
                key={stage}
                href={hrefFor(stage)}
                className="border px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
                style={{
                  borderColor: activeStage === stage ? NAVY : '#e5e5e5',
                  color: activeStage === stage ? NAVY : '#737373',
                }}
              >
                {stage}
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-600">
            {statusSummary.map((item) => (
              <span key={item.status}>
                <strong>{item.status}:</strong> {item.count}
              </span>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {outputs.map((item) => (
            <article key={item.slug} className="border border-neutral-200 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                {item.stage} ·{' '}
                <span style={{ color: statusTone(item.status) }}>{item.status}</span>
              </p>
              <h2 className="mt-1 text-xl font-black" style={{ color: NAVY }}>
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{item.purpose}</p>
              <p className="mt-3 text-sm">
                <strong>Capability:</strong> {item.relatedCapability}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                <strong>Inputs:</strong> {item.requiredInputs.slice(0, 2).join(' · ')}
                {item.requiredInputs.length > 2 ? ' · …' : ''}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/admin/factory/${item.slug}`}
                  className="border px-4 py-2 text-xs font-black uppercase tracking-widest"
                  style={{ color: NAVY }}
                >
                  Output detail
                </Link>
                <Link
                  href={item.executeHref}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-neutral-900"
                >
                  Start workflow
                </Link>
              </div>
            </article>
          ))}
        </section>

        {outputs.length === 0 ? (
          <p className="border border-neutral-200 bg-white p-5 text-sm text-neutral-500">
            No outputs match the current stage filter.
          </p>
        ) : null}
      </div>
    </main>
  );
}
