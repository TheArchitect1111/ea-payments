import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug, getContentRequestsForClient } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

function fmtDate(value?: string): string {
  if (!value) return 'Pending';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function UpdatesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? verifySession(token) : null;

  if (!session) redirect('/portal/login');
  if (session.slug !== slug) redirect(`/portal/${session.slug}/updates`);

  const client = await getClientByPortalSlug(slug);
  if (!client) redirect('/portal/login');

  const requests = await getContentRequestsForClient(client.id);
  const pending = requests.filter((r) => ['Pending Review', 'In Progress', 'Awaiting Approval'].includes(r.status)).length;
  const published = requests.filter((r) => ['Published', 'Completed'].includes(r.status)).length;
  const scheduled = requests.filter((r) => r.status === 'Scheduled').length;

  return (
    <main className="min-h-screen bg-[#F8F6F2]">
      <header className="px-6 py-6" style={{ backgroundColor: NAVY }}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <img src="/images/ea-logo.png" alt="Efficiency Architects" className="h-16 w-auto" />
            <h1 className="mt-4 text-2xl font-black uppercase tracking-wide text-white">Content Command Center</h1>
          </div>
          <a href={`/portal/${slug}`} className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100 hover:text-white">Back To Portal</a>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            ['Pending Requests', pending],
            ['Published Updates', published],
            ['Scheduled Updates', scheduled],
            ['Total Requests', requests.length],
          ].map(([label, value]) => (
            <div key={label} className="border border-neutral-200 bg-white p-5">
              <p className="text-3xl font-black" style={{ color: NAVY }}>{value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href={`/portal/${slug}/updates/new`} className="px-5 py-3 text-xs font-black uppercase tracking-[0.2em]" style={{ backgroundColor: GOLD, color: NAVY }}>
            Submit Update Request
          </a>
          <a href={`/portal/${slug}/updates/enhancement`} className="border px-5 py-3 text-xs font-black uppercase tracking-[0.2em]" style={{ borderColor: NAVY, color: NAVY }}>
            Request Enhancement
          </a>
        </div>

        <div className="mt-8 border border-neutral-200 bg-white">
          <div className="border-b border-neutral-100 p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: GOLD }}>Recent Requests</p>
          </div>
          {requests.length === 0 ? (
            <p className="p-8 text-sm text-neutral-500">No requests have been submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-5 py-3">Request Type</th>
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date Submitted</th>
                    <th className="px-5 py-3">Date Published</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {requests.slice(0, 20).map((request) => (
                    <tr key={request.id}>
                      <td className="px-5 py-4 font-semibold text-neutral-800">{request.requestType}</td>
                      <td className="px-5 py-4 text-neutral-700">{request.title}</td>
                      <td className="px-5 py-4">
                        <span className="bg-neutral-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-neutral-600">{request.status}</span>
                      </td>
                      <td className="px-5 py-4 text-neutral-500">{fmtDate(request.dateSubmitted)}</td>
                      <td className="px-5 py-4 text-neutral-500">{fmtDate(request.datePublished)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
