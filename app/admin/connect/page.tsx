import Link from 'next/link';
import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import { getConnectDashboard, getConnectOrg, listConnectOrgs } from '@/lib/connect-store';

export const dynamic = 'force-dynamic';

const INK = '#111111';
const GOLD = '#c9a844';
const PAPER = '#fbfaf7';

function Metric({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="border border-neutral-200 bg-white p-5">
      <p className="text-3xl font-black leading-none" style={{ color: INK }}>{value}</p>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-neutral-500">{label}</p>
      {note ? <p className="mt-2 text-sm leading-6 text-neutral-500">{note}</p> : null}
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: [string, number][] }) {
  return (
    <section className="border border-neutral-200 bg-white p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>{title}</p>
      <div className="mt-4 grid gap-3">
        {items.length ? items.map(([name, count]) => (
          <div key={name} className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-3">
            <span className="text-sm font-bold text-neutral-800">{name}</span>
            <span className="text-sm font-black" style={{ color: INK }}>{count}</span>
          </div>
        )) : <p className="text-sm text-neutral-500">No data yet.</p>}
      </div>
    </section>
  );
}

export default async function AdminConnectPage() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(EA_ADMIN_COOKIE)?.value);
  if (!session) redirectToAdminLogin('/admin/connect');

  const org = getConnectOrg('cpr');
  const orgs = listConnectOrgs();
  const dashboard = await getConnectDashboard(org.slug);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8" style={{ backgroundColor: PAPER, color: INK }}>
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 border-b border-neutral-200 pb-7 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: GOLD }}>
              Connect
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.95] sm:text-6xl">
              Relationship Activation Platform
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-600">
              Convert in-person conversations into intelligent, trackable relationships with resources,
              routing, sequences, and AI-powered follow-up recommendations.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/connect/${org.slug}?event=Charlotte%20Tournament&rep=Coach%20Mike`} className="inline-flex min-h-11 items-center justify-center bg-neutral-950 px-5 text-xs font-black uppercase tracking-[0.14em] text-white">
              Open Capture
            </Link>
            <Link href="/admin/master" className="inline-flex min-h-11 items-center justify-center border border-neutral-300 px-5 text-xs font-black uppercase tracking-[0.14em] text-neutral-900">
              Master Control
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <Metric label="Connections Made" value={dashboard.total} note="QR, NFC, direct, and representative capture." />
          <Metric label="Active Opportunities" value={dashboard.activeOpportunities} note="Relationships still moving." />
          <Metric label="Hot Leads" value={dashboard.hot} note="High score or high follow-up priority." />
          <Metric label="Needs Follow-Up" value={dashboard.needsFollowUp} note="Forgotten opportunity watchlist." />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="border border-neutral-200 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-neutral-200 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>Opportunity Pipeline</p>
                <h2 className="mt-2 text-2xl font-black">Relationships that should not disappear</h2>
              </div>
              <span className="text-4xl font-black">{dashboard.averageOpportunityScore}</span>
            </div>
            <div className="divide-y divide-neutral-100">
              {dashboard.relationships.map((relationship) => (
                <article key={relationship.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_170px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black">{relationship.name}</h3>
                      <span className="bg-neutral-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-neutral-600">
                        {relationship.status}
                      </span>
                      <span className="px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white" style={{ backgroundColor: GOLD }}>
                        {relationship.aiProfile.followUpPriority}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">{relationship.aiProfile.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {relationship.tags.slice(0, 5).map((tag) => (
                        <span key={tag} className="border border-neutral-200 px-2 py-1 text-xs font-bold text-neutral-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-sm font-bold text-neutral-800">{relationship.aiProfile.recommendedAction}</p>
                  </div>
                  <div className="grid content-start gap-2 text-sm">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-neutral-400">Score</span>
                    <strong className="text-5xl leading-none">{relationship.aiProfile.opportunityScore}</strong>
                    <span className="text-neutral-500">{relationship.event ?? 'No event'} / {relationship.representative ?? 'Unassigned'}</span>
                    <span className="text-neutral-500">{relationship.routedTeam}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <section className="border border-neutral-200 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>Forgotten Opportunity Engine</p>
              <h2 className="mt-2 text-2xl font-black">Needs attention now</h2>
              <div className="mt-4 grid gap-3">
                {dashboard.forgottenOpportunities.length ? dashboard.forgottenOpportunities.map((relationship) => (
                  <div key={relationship.id} className="border-t border-neutral-100 pt-3">
                    <p className="font-black">{relationship.name}</p>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">{relationship.aiProfile.reasons.join(' · ')}</p>
                  </div>
                )) : <p className="text-sm text-neutral-500">No forgotten opportunities right now.</p>}
              </div>
            </section>

            <ListBlock title="Most Effective Events" items={dashboard.topEvents} />
            <ListBlock title="Representative Performance" items={dashboard.topRepresentatives} />
            <ListBlock title="Resource Delivery" items={dashboard.topResources} />
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          <section className="border border-neutral-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>Organizations</p>
            <div className="mt-4 grid gap-3">
              {orgs.map((item) => (
                <div key={item.slug} className="border-t border-neutral-100 pt-3">
                  <p className="font-black">{item.name}</p>
                  <p className="mt-1 text-sm text-neutral-500">{item.nfcDestination}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-neutral-200 bg-white p-5 lg:col-span-2">
            <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>Resource Sequence</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {org.sequence.map((step) => (
                <div key={step.id} className="border border-neutral-100 p-4">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
                    {step.delayDays === 0 ? 'Immediately' : `${step.delayDays} days later`} / {step.channel}
                  </span>
                  <p className="mt-2 font-black">{step.title}</p>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
