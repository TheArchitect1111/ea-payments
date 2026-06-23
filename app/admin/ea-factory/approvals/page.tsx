import Link from 'next/link';
import { listEACPApprovals } from '@/lib/eacp-launch';
import ApprovalActions from './ApprovalActions';

export const dynamic = 'force-dynamic';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

export default async function ApprovalsPlaceholderPage() {
  const approvals = await listEACPApprovals();

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-neutral-900">
      <section className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
            EA Factory / Approval Center
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight" style={{ color: NAVY }}>
                Approval Queue
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                Review launch packages, approve build handoffs, reject packages, or request revisions with audit trail comments.
              </p>
            </div>
            <Link href="/admin/ea-factory/launches" className="bg-[#1B2B4D] px-5 py-3 text-xs font-black uppercase tracking-wider text-white">
              Back To Launches
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {approvals.length === 0 ? (
          <div className="border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-500">
            No EACP approval records are queued in this runtime session.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {approvals.map((approval) => (
              <article key={approval.id} className="border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
                      EACP Approval
                    </p>
                    <h2 className="mt-2 text-xl font-black" style={{ color: NAVY }}>
                      {approval.client}
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#FAF8F3] px-3 py-1 text-xs font-bold uppercase tracking-wider text-neutral-600">
                    {approval.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-neutral-500">Queued {new Date(approval.queuedAt).toLocaleString()}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {approval.reviewAreas.map((area) => (
                    <span key={area} className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600">
                      {area}
                    </span>
                  ))}
                </div>
                <Link href={`/admin/ea-factory/launches/${approval.launchId}`} className="mt-5 inline-block text-sm font-bold" style={{ color: NAVY }}>
                  Review Package
                </Link>
                {approval.status === 'queued' ? <ApprovalActions launchId={approval.launchId} /> : null}
                {approval.comments ? (
                  <p className="mt-4 text-sm leading-6 text-neutral-600">
                    <strong>{approval.reviewerName}</strong>: {approval.comments}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
