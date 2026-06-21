import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug, getContentRequestsForClient } from '@/lib/airtable';
import { PortalNav, NAVY, GOLD } from '../PortalNav';
import '../ea-portal.css';

export const dynamic = 'force-dynamic';

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
    <div className="ep-page">
      <PortalNav slug={slug} active="updates" />

      <main className="ep-main">
        <div className="ep-welcome">
          <p className="ep-welcome-label">Update Hub™</p>
          <h1 className="ep-welcome-heading">Communications & Requests</h1>
        </div>

        <div className="ep-pulse-grid">
          {[
            ['Pending Requests', pending],
            ['Published Updates', published],
            ['Scheduled Updates', scheduled],
            ['Total Requests', requests.length],
          ].map(([label, value]) => (
            <div key={label as string} className="ep-card ep-pulse-score-card">
              <p className="ep-card-title">{label as string}</p>
              <p className="ep-pulse-score-number" style={{ color: NAVY }}>
                {value as number}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-3">
          <a
            href={`/portal/${slug}/updates/new`}
            className="ep-pulse-cta"
            style={{ backgroundColor: GOLD, color: NAVY }}
          >
            Submit Update Request
          </a>
          <a
            href={`/portal/${slug}/updates/enhancement`}
            className="ep-pulse-cta"
            style={{ backgroundColor: NAVY, color: GOLD }}
          >
            Request Enhancement
          </a>
        </div>

        <div className="ep-card mt-6">
          <p className="ep-card-title">Recent Requests</p>
          {requests.length === 0 ? (
            <p className="ep-placeholder-text">No requests have been submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="ep-info-table w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="ep-info-label px-0 py-2">Request Type</th>
                    <th className="ep-info-label px-0 py-2">Title</th>
                    <th className="ep-info-label px-0 py-2">Status</th>
                    <th className="ep-info-label px-0 py-2">Submitted</th>
                    <th className="ep-info-label px-0 py-2">Published</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.slice(0, 20).map((request) => (
                    <tr key={request.id}>
                      <td className="ep-info-value py-3">{request.requestType}</td>
                      <td className="ep-info-value py-3">{request.title}</td>
                      <td className="ep-info-value py-3">
                        <span className="bg-neutral-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-neutral-600">
                          {request.status}
                        </span>
                      </td>
                      <td className="ep-info-value py-3 text-neutral-500">{fmtDate(request.dateSubmitted)}</td>
                      <td className="ep-info-value py-3 text-neutral-500">{fmtDate(request.datePublished)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
