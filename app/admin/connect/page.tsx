import Link from 'next/link';
import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import {
  getConnectCampaignUrl,
  getConnectDashboard,
  getConnectOrg,
  getConnectReadinessAudit,
  listConnectOrgs,
} from '@/lib/connect-store';

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

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border border-neutral-200 bg-white p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ListBlock({ title, items }: { title: string; items: [string, number][] }) {
  return (
    <Panel eyebrow="Performance" title={title}>
      <div className="grid gap-3">
        {items.length ? items.map(([name, count]) => (
          <div key={name} className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-3">
            <span className="text-sm font-bold text-neutral-800">{name}</span>
            <span className="text-sm font-black" style={{ color: INK }}>{count}</span>
          </div>
        )) : <p className="text-sm text-neutral-500">No data yet.</p>}
      </div>
    </Panel>
  );
}

export default async function AdminConnectPage() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(EA_ADMIN_COOKIE)?.value);
  if (!session) redirectToAdminLogin('/admin/connect');

  const org = await getConnectOrg('cpr');
  const orgs = await listConnectOrgs();
  const dashboard = await getConnectDashboard(org.slug);
  const readiness = getConnectReadinessAudit();
  const productReadiness = Math.round(readiness.reduce((sum, item) => sum + item.score, 0) / readiness.length);
  const launchReadiness = Math.round((productReadiness * 0.72) + 18);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8" style={{ backgroundColor: PAPER, color: INK }}>
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 border-b border-neutral-200 pb-7 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: GOLD }}>Connect</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.95] sm:text-6xl">
              Relationship Activation Platform
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-600">
              Convert real-world conversations into captured relationships, automated journeys,
              intelligent follow-up, and measurable opportunities.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/connect/tenants" className="inline-flex min-h-11 items-center justify-center bg-neutral-950 px-5 text-xs font-black uppercase tracking-[0.14em] text-white">
              Tenant Creator
            </Link>
            <Link href={`/connect/${org.slug}?event=Charlotte%20Tournament&rep=Coach%20Mike&campaign=coach-mike-charlotte`} className="inline-flex min-h-11 items-center justify-center bg-neutral-950 px-5 text-xs font-black uppercase tracking-[0.14em] text-white">
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

        <section className="mt-4 grid gap-4 md:grid-cols-4">
          <Metric label="Conversion Rate" value={`${dashboard.conversionRate}%`} note="Application or conversion movement." />
          <Metric label="Product Readiness" value={productReadiness} note="Average across product areas." />
          <Metric label="Launch Readiness" value={launchReadiness} note="Weighted by testing and wiring." />
          <Metric label="Automation Rules" value={org.automationRules.filter((rule) => rule.enabled).length} note="Enabled trigger/action rules." />
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
                        <span key={tag} className="border border-neutral-200 px-2 py-1 text-xs font-bold text-neutral-600">{tag}</span>
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
            <Panel eyebrow="Forgotten Opportunity Engine" title="Needs attention now">
              <div className="grid gap-3">
                {dashboard.forgottenOpportunities.length ? dashboard.forgottenOpportunities.map((relationship) => (
                  <div key={relationship.id} className="border-t border-neutral-100 pt-3">
                    <p className="font-black">{relationship.name}</p>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">{relationship.aiProfile.reasons.join(' / ')}</p>
                  </div>
                )) : <p className="text-sm text-neutral-500">No forgotten opportunities right now.</p>}
              </div>
            </Panel>
            <ListBlock title="Most Effective Events" items={dashboard.topEvents} />
            <ListBlock title="Representative Performance" items={dashboard.topRepresentatives} />
            <ListBlock title="Resource Delivery" items={dashboard.topResources} />
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          <Panel eyebrow="Template Engine" title="White-label setup">
            <div className="grid gap-3 text-sm">
              <div className="border-t border-neutral-100 pt-3"><b>Name</b><p className="text-neutral-500">{org.template.name}</p></div>
              <div className="border-t border-neutral-100 pt-3"><b>Domain</b><p className="text-neutral-500">{org.template.domain}</p></div>
              <div className="border-t border-neutral-100 pt-3"><b>Font</b><p className="text-neutral-500">{org.template.font}</p></div>
              <div className="border-t border-neutral-100 pt-3"><b>Email From</b><p className="text-neutral-500">{org.template.emailFrom}</p></div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <span className="h-10 border" style={{ backgroundColor: org.colors.ink }} />
                <span className="h-10 border" style={{ backgroundColor: org.colors.accent }} />
                <span className="h-10 border" style={{ backgroundColor: org.colors.soft }} />
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Organizations" title="Tenant registry">
            <div className="grid gap-3">
              {orgs.map((item) => (
                <div key={item.slug} className="border-t border-neutral-100 pt-3">
                  <p className="font-black">{item.name}</p>
                  <p className="mt-1 text-sm text-neutral-500">{item.nfcDestination}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Resource Offer" title={org.offer.headline}>
            <p className="text-sm leading-6 text-neutral-600">{org.offer.promise}</p>
            <div className="mt-4 grid gap-2">
              {org.trustSignals.map((signal) => (
                <span key={signal} className="border border-neutral-100 p-3 text-sm font-bold text-neutral-600">{signal}</span>
              ))}
            </div>
          </Panel>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <Panel eyebrow="QR Management Center" title="Campaign, event, staff, location, NFC">
            <div className="grid gap-4">
              {org.campaigns.map((campaign) => {
                const url = getConnectCampaignUrl(org, campaign);
                const qrPath = `/api/connect/qr?url=${encodeURIComponent(url)}&label=${encodeURIComponent(campaign.name)}`;
                return (
                  <div key={campaign.id} className="grid gap-4 border-t border-neutral-100 pt-4 md:grid-cols-[120px_1fr]">
                    <img alt={`${campaign.name} QR`} src={qrPath} className="h-[120px] w-[120px] border border-neutral-200 bg-white" />
                    <div>
                      <p className="font-black">{campaign.name}</p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-neutral-400">{campaign.type}</p>
                      <p className="mt-2 break-all text-sm text-neutral-500">{url}</p>
                      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                        <span className="bg-neutral-50 p-2"><b className="block text-base">{campaign.scans}</b>Scans</span>
                        <span className="bg-neutral-50 p-2"><b className="block text-base">{campaign.conversions}</b>Captures</span>
                        <span className="bg-neutral-50 p-2"><b className="block text-base">{campaign.resourceOpens}</b>Opens</span>
                        <span className="bg-neutral-50 p-2"><b className="block text-base">{campaign.applications}</b>Apps</span>
                      </div>
                      <a className="mt-3 inline-flex text-xs font-black uppercase tracking-[0.12em]" style={{ color: GOLD }} href={qrPath}>Download SVG</a>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel eyebrow="Universal Resource Library" title="Resources, permissions, analytics">
            <div className="grid gap-3 md:grid-cols-2">
              {org.resources.map((resource) => (
                <article key={resource.id} className="border border-neutral-100 p-4">
                  <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: GOLD }}>{resource.type}</span>
                  <h3 className="mt-2 font-black">{resource.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{resource.description}</p>
                  <p className="mt-2 text-xs font-bold text-neutral-500">{resource.audience} / {resource.permission}</p>
                  <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[11px]">
                    <span className="bg-neutral-50 p-2"><b className="block">{resource.analytics.opens}</b>Opens</span>
                    <span className="bg-neutral-50 p-2"><b className="block">{resource.analytics.clicks}</b>Clicks</span>
                    <span className="bg-neutral-50 p-2"><b className="block">{resource.analytics.downloads}</b>DL</span>
                    <span className="bg-neutral-50 p-2"><b className="block">{resource.analytics.videoViews}</b>Views</span>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel eyebrow="Nurture Engine" title="Resource sequencing">
            <div className="grid gap-3 md:grid-cols-2">
              {org.sequence.map((step) => (
                <div key={step.id} className="border border-neutral-100 p-4">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
                    {step.delayDays === 0 ? 'Immediately' : `${step.delayDays} days later`} / {step.channel}
                  </span>
                  <p className="mt-2 font-black">{step.title}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Automation Center" title="Trigger/action rules">
            <div className="grid gap-3">
              {org.automationRules.map((rule) => (
                <div key={rule.id} className="border border-neutral-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{rule.name}</p>
                    <span className={rule.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'} style={{ padding: '4px 8px', fontSize: 11, fontWeight: 900 }}>
                      {rule.enabled ? 'Enabled' : 'Off'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">When: {rule.trigger}</p>
                  <p className="mt-2 text-sm font-bold text-neutral-700">Then: {rule.actions.join(' / ')}</p>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Panel eyebrow="Client Launch Builder" title="Create, configure, launch">
            <div className="grid gap-3">
              {['Create Organization', 'Upload Logo', 'Add Resource', 'Create Campaign', 'Generate QR', 'Launch'].map((item, index) => (
                <div key={item} className="flex items-center gap-3 border border-neutral-100 p-3">
                  <span className="grid h-8 w-8 place-items-center bg-neutral-950 text-xs font-black text-white">{index + 1}</span>
                  <span className="font-bold">{item}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Product Audit" title="Launch readiness review">
            <div className="grid gap-3">
              {readiness.map((item) => (
                <article key={item.area} className="border border-neutral-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-black">{item.area}</h3>
                    <span className="text-2xl font-black">{item.score}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{item.currentState}</p>
                  <p className="mt-2 text-sm font-bold" style={{ color: item.priority === 'Critical' ? '#b91c1c' : GOLD }}>{item.priority} priority</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{item.recommendation}</p>
                </article>
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}
