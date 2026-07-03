import { NAVY, GOLD } from '@/lib/design-system';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminLogin from '../../../master/AdminLogin';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';
import { getProtocolLibraryFromGitHub } from '@/lib/ea-factory';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProtocolDetailPage({ params }: PageProps) {
  if (!(await hasAdminPageAccess())) return <AdminLogin />;
  const { id } = await params;
  const library = await getProtocolLibraryFromGitHub();
  const protocol = library.protocols.find((item) => item.id === id);

  if (!protocol) notFound();

  return (
    <main className="min-h-screen bg-[#FAF8F3] px-6 py-10 text-neutral-900">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/protocol-center" className="text-sm font-bold" style={{ color: GOLD }}>
          Back to Protocol Center
        </Link>
        <section className="mt-5 border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            Protocol Center
          </p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight" style={{ color: NAVY }}>
                {protocol.name}
              </h1>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-neutral-400">
                {protocol.category} / active version {protocol.activeVersion}
              </p>
            </div>
            <span className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-bold text-neutral-600">
              {protocol.approvalStatus ?? protocol.status}
            </span>
          </div>
          <p className="mt-5 text-sm leading-6 text-neutral-600">{protocol.purpose}</p>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          <Meta label="Owner" value={protocol.owner ?? 'Efficiency Architects'} />
          <Meta label="Status" value={protocol.status} />
          <Meta label="Created" value={protocol.createdDate ?? 'Not set'} />
          <Meta label="Modified" value={protocol.modifiedDate ?? 'Not set'} />
          <Meta label="Approved By" value={protocol.approvedBy ?? 'Pending'} />
          <Meta label="Approval Required" value={protocol.approvalRequired ? 'Yes' : 'No'} />
        </section>

        <section className="mt-5 border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black" style={{ color: NAVY }}>
            Governed Areas
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {protocol.governs.map((item) => (
              <span key={item} className="rounded-full bg-[#FAF8F3] px-3 py-1 text-xs font-semibold text-neutral-600">
                {item}
              </span>
            ))}
          </div>
          <h2 className="mt-6 text-lg font-black" style={{ color: NAVY }}>
            Tags
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {protocol.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600">
                {tag}
              </span>
            ))}
          </div>
          {protocol.futureNotes ? (
            <p className="mt-6 border-l-4 border-[#C9A844] bg-[#FAF8F3] p-4 text-sm leading-6 text-neutral-600">
              {protocol.futureNotes}
            </p>
          ) : null}
        </section>

        <section className="mt-5 border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black" style={{ color: NAVY }}>
            Version History
          </h2>
          <div className="mt-4 space-y-3">
            {protocol.versionHistory.map((version) => (
              <article key={version.version} className="border border-neutral-200 bg-[#FAF8F3] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <strong>v{version.version}</strong>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">{version.status}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{version.notes}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</p>
      <p className="mt-1 text-sm font-bold" style={{ color: NAVY }}>
        {value}
      </p>
    </div>
  );
}
