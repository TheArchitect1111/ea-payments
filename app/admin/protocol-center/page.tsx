import Link from 'next/link';
import type { ReactNode } from 'react';
import { getProtocolLibraryFromGitHub } from '@/lib/ea-factory';

export const dynamic = 'force-dynamic';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] ?? '' : raw ?? '';
}

export default async function ProtocolCenterPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const query = value(params, 'q');
  const category = value(params, 'category');
  const status = value(params, 'status');
  const library = await getProtocolLibraryFromGitHub();
  const queryNeedle = query.toLowerCase().trim();
  const baseProtocols = queryNeedle
    ? library.protocols.filter((protocol) =>
        [
          protocol.id,
          protocol.name,
          protocol.category,
          protocol.status,
          protocol.purpose,
          protocol.owner ?? '',
          ...protocol.tags,
          ...protocol.governs,
        ]
          .join(' ')
          .toLowerCase()
          .includes(queryNeedle),
      )
    : library.protocols;
  const protocols = baseProtocols.filter((protocol) => {
    const categoryMatch = !category || protocol.category === category;
    const statusMatch = !status || protocol.status === status || protocol.approvalStatus === status;
    return categoryMatch && statusMatch;
  });

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-neutral-900">
      <section className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            Pulse / Administration
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight" style={{ color: NAVY }}>
                Protocol Center&trade;
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-600">
                Store, search, retrieve, and review versioned EA protocols. Current source: {library.source === 'github' ? 'GitHub ea-protocols' : 'Pulse seed library'}.
              </p>
            </div>
            <Link href="/admin/ea-factory" className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
              EA Factory
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <form className="grid gap-3 border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_180px_180px_auto]">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search protocols, owners, tags, governed areas..."
            className="min-w-0 border border-neutral-200 px-4 py-3 text-sm outline-none"
          />
          <select name="category" defaultValue={category} className="border border-neutral-200 px-4 py-3 text-sm">
            <option value="">All categories</option>
            {library.categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={status} className="border border-neutral-200 px-4 py-3 text-sm">
            <option value="">All statuses</option>
            {['active', 'approved', 'draft', 'review', 'needs-review'].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button className="bg-[#C9A844] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#1B2B4D]">
            Search
          </button>
        </form>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Protocols" value={String(library.protocols.length)} />
          <Metric label="Categories" value={String(library.categories.length)} />
          <Metric label="Approval Ready" value={String(library.protocols.filter((item) => item.approvalStatus === 'active' || item.approvalStatus === 'approved').length)} />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {protocols.map((protocol) => (
            <Link
              key={protocol.id}
              href={`/admin/ea-factory/protocols/${protocol.id}`}
              className="block border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-[#C9A844]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black" style={{ color: NAVY }}>
                    {protocol.name}
                  </h2>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-neutral-400">
                    {protocol.category} / v{protocol.activeVersion}
                  </p>
                </div>
                <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-bold text-neutral-600">
                  {protocol.approvalStatus ?? protocol.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{protocol.purpose}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill>Owner: {protocol.owner ?? 'EA'}</Pill>
                <Pill>Updated: {protocol.modifiedDate ?? 'Not set'}</Pill>
                {protocol.tags.slice(0, 3).map((tag) => (
                  <Pill key={tag}>{tag}</Pill>
                ))}
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-3xl font-black" style={{ color: NAVY }}>{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-[#FAF8F3] px-3 py-1 text-xs font-semibold text-neutral-600">{children}</span>;
}
