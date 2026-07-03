import { NAVY, GOLD } from '@/lib/design-system';
import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE, parseAdminSession } from '@/lib/ea-admin-auth';
import {
  getProposalsWithAssessments,
  getAllAssessments,
  getAllClientRecords,
  getPartnerRecords,
  getCPRAthletes,
  getBrotherHubChapters,
  getSisterHubChapters,
  getAllContentRequests,
} from '@/lib/airtable';
import { getOpportunities } from '@/lib/partner-network';
import { getCaptures } from '@/lib/capture-records';
import { buildAttentionItems } from '@/lib/pulse-attention';
import { listRecentPulseEvents } from '@/lib/pulse-bus';
import { buildEAMissionControl } from '@/lib/mission-control-data';
import { listEAActivityEvents } from '@/lib/ea-activity-events';
import { isCaptureApiKeyConfigured } from '@/lib/capture-api-key';
import { EA_SATELLITE_URLS } from '@/lib/platform-urls';
import MissionControlPanel from './MissionControlPanel';
import AdminLogin from './AdminLogin';

export const dynamic = 'force-dynamic';

const CREAM = '#FAF8F3';

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);
}

function fmtDate(str: string | undefined): string {
  if (!str) return '';
  const d = new Date(str.includes('T') ? str : str + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return '0%';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

interface TileProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

function Tile({ label, value, sub, accent = GOLD }: TileProps) {
  return (
    <div
      className="p-5"
      style={{ backgroundColor: CREAM, borderTop: `3px solid ${accent}` }}
    >
      <p className="text-2xl font-extrabold leading-tight" style={{ color: NAVY }}>
        {value}
      </p>
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mt-1">
        {label}
      </p>
      {sub && <p className="text-xs text-neutral-400 mt-1 leading-snug">{sub}</p>}
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: GOLD }}>
      {title}
    </p>
  );
}

interface PlatformTileProps {
  title: string;
  metric: string;
  metricLabel: string;
  sub: string;
  href: string;
}

function PlatformTile({ title, metric, metricLabel, sub, href }: PlatformTileProps) {
  return (
    <div className="bg-white border border-neutral-200 p-6 flex flex-col gap-3">
      <p className="text-sm font-bold uppercase tracking-wide" style={{ color: NAVY }}>
        {title}
      </p>
      <div>
        <p className="text-3xl font-extrabold" style={{ color: NAVY }}>
          {metric}
        </p>
        <p className="text-xs text-neutral-500">{metricLabel}</p>
      </div>
      <p className="text-xs text-neutral-400">{sub}</p>
      <a
        href={href}
        className="text-xs font-semibold mt-auto"
        style={{ color: GOLD }}
      >
        View platform &rarr;
      </a>
    </div>
  );
}

const ACTIVITY_DOT: Record<string, string> = {
  assessment: '#1D4ED8',
  approved: '#065F46',
  paid: '#166534',
  onboarded: GOLD,
};

const ACTIVITY_LABEL: Record<string, string> = {
  assessment: 'Assessment',
  approved: 'Approval',
  paid: 'Payment',
  onboarded: 'Onboarding',
};

export default async function MasterPortalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return <AdminLogin />;
  }

  const [assessments, proposals, clientRecords, partnerRecords, opportunities, cprAthletes, brotherHubChapters, sisterHubChapters, captures, contentRequests] =
    await Promise.all([
      getAllAssessments(),
      getProposalsWithAssessments(),
      getAllClientRecords(),
      getPartnerRecords(),
      getOpportunities(),
      getCPRAthletes(),
      getBrotherHubChapters(),
      getSisterHubChapters(),
      getCaptures(8),
      getAllContentRequests(),
    ]);

  // Revenue Overview — Stripe client records are source of truth for collected payments
  const stripeRevenueCollected = clientRecords.reduce((sum, c) => sum + (c.amountPaid || 0), 0);
  const paidProposals = proposals.filter((p) => p.status === 'Approved & Paid');
  const proposalOnlyRevenue = paidProposals.reduce((sum, p) => sum + (p.recommendedFee || 0), 0);
  const paidClientEmails = new Set(
    clientRecords.filter((c) => c.amountPaid > 0).map((c) => (c.email ?? '').toLowerCase()),
  );
  const orphanProposalRevenue = paidProposals
    .filter((p) => p.email && !paidClientEmails.has(p.email.toLowerCase()))
    .reduce((sum, p) => sum + (p.recommendedFee || 0), 0);
  const totalRevenueCollected = stripeRevenueCollected + orphanProposalRevenue;
  const lastStripePayment = clientRecords
    .filter((c) => c.paymentReceivedAt)
    .sort(
      (a, b) =>
        new Date(b.paymentReceivedAt!).getTime() - new Date(a.paymentReceivedAt!).getTime(),
    )[0];
  const revenueForecast = proposals
    .filter((p) => p.status === 'Approved' || p.status === 'Sent')
    .reduce((sum, p) => sum + (p.recommendedFee || 0), 0);
  const outstandingInvoices = proposals.filter(
    (p) => p.paymentStatus === 'Unpaid' && p.status !== 'Rejected'
  ).length;
  const averageProjectValue =
    clientRecords.filter((c) => c.amountPaid > 0).length > 0
      ? stripeRevenueCollected / clientRecords.filter((c) => c.amountPaid > 0).length
      : paidProposals.length > 0
        ? proposalOnlyRevenue / paidProposals.length
        : 0;

  const discoveryScheduled = clientRecords.filter((c) => c.discoveryStatus === 'Scheduled').length;
  const discoveryFollowUp = clientRecords.filter(
    (c) => c.discoveryStatus === 'Follow-Up Needed',
  ).length;

  const clientsStuckOnboarding = clientRecords.filter((c) => {
    if (c.amountPaid <= 0) return false;
    if (c.onboardingStatus === 'Complete') return false;
    // Deterministic approximation: paid clients still in early onboarding states.
    return c.onboardingStatus === 'Not Started' || c.onboardingStatus === 'In Progress';
  }).length;

  // Pipeline Summary
  const sentStatuses = new Set(['Approved', 'Sent', 'Approved & Paid']);
  const approvedStatuses = new Set(['Approved', 'Approved & Paid']);
  const assessmentsSubmitted = assessments.length;
  const proposalsSent = proposals.filter((p) => sentStatuses.has(p.status)).length;
  const proposalsApproved = proposals.filter((p) => approvedStatuses.has(p.status)).length;
  const dealsClosed = paidProposals.length;
  const conversionRate = pct(dealsClosed, assessmentsSubmitted);

  // Active Projects
  const activeProjects = [...clientRecords]
    .filter((c) => c.onboardingStatus !== 'Complete')
    .sort((a, b) => new Date(b.createdTime ?? 0).getTime() - new Date(a.createdTime ?? 0).getTime());

  // Partner Network
  const totalCommissionOwed = partnerRecords.reduce((sum, p) => sum + p.commissionOwed, 0);
  const totalCommissionPaid = partnerRecords.reduce((sum, p) => sum + p.commissionPaid, 0);

  // Platform Snapshot
  const cprActiveAthletes = cprAthletes.filter((a) => a.status === 'Active').length;
  const brotherHubMembers = brotherHubChapters.reduce((sum, c) => sum + c.memberCount, 0);
  const brotherHubActiveChapters = brotherHubChapters.filter((c) => c.status === 'Active').length;
  const sisterHubMembers = sisterHubChapters.reduce((sum, c) => sum + c.memberCount, 0);
  const sisterHubActiveChapters = sisterHubChapters.filter((c) => c.status === 'Active').length;
  const proposalsPendingReview = proposals.filter((p) => p.status === 'Pending Review').length;

  const attentionItems = buildAttentionItems({
    captures,
    contentRequests,
    proposalsPendingReview,
    onboardingWebhooksMissing: !process.env.ONBOARDING_WEBHOOK_URL || !process.env.ESIGN_WEBHOOK_URL,
    captureApiKeyMissing: !isCaptureApiKeyConfigured(),
    cprAthleteCount: cprAthletes.length,
    cprActiveCount: cprActiveAthletes,
    brotherHubMembers,
    sisterHubMembers,
    clientsStuckOnboarding,
    discoveryFollowUpCount: discoveryFollowUp,
  });

  const adminUser = parseAdminSession(token);
  const activityEvents = await listEAActivityEvents(40);
  const mission = buildEAMissionControl({
    attentionItems,
    pulseEvents: listRecentPulseEvents(30),
    activityEvents,
    userName: adminUser?.name?.split(' ')[0] ?? adminUser?.email?.split('@')[0],
    role: 'executive',
  });

  // Recent Activity Feed
  interface ActivityItem {
    type: 'assessment' | 'approved' | 'paid' | 'onboarded';
    description: string;
    date: string;
  }

  const activity: ActivityItem[] = [
    ...assessments
      .filter((a) => a.createdTime)
      .map((a) => ({
        type: 'assessment' as const,
        description: `New Assessment Submitted: ${a.businessName || 'Unknown business'}`,
        date: a.createdTime,
      })),
    ...proposals
      .filter((p) => approvedStatuses.has(p.status) && p.dateApproved)
      .map((p) => ({
        type: 'approved' as const,
        description: `Proposal Approved: ${p.businessName || p.contactName}`,
        date: p.dateApproved as string,
      })),
    ...paidProposals
      .filter((p) => p.dateApproved)
      .map((p) => ({
        type: 'paid' as const,
        description: `Payment Received: ${p.businessName || p.contactName}`,
        date: p.dateApproved as string,
      })),
    ...clientRecords
      .filter((c) => c.createdTime)
      .map((c) => ({
        type: 'onboarded' as const,
        description: `New Client Onboarded: ${c.clientName}`,
        date: c.createdTime as string,
      })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const lastUpdated = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <>
      <div className="bg-white border-b border-neutral-200 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <img src="/images/ea-logo-hd.png" alt="Efficiency Architects" style={{ height: '60px', width: 'auto' }} />
            <div>
              <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>
                Mission Control
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                What deserves your attention today
              </p>
            </div>
          </div>
          <p className="text-xs text-neutral-400">Last updated {lastUpdated}</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        <MissionControlPanel mission={mission} />

        {/* Operations dashboard — revenue, pipeline, platforms */}
        <section>
          <SectionHead title="Revenue Overview" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Tile
              label="Total Revenue Collected"
              value={fmt(totalRevenueCollected)}
              sub={
                lastStripePayment?.paymentReceivedAt
                  ? `Last payment ${fmtDate(lastStripePayment.paymentReceivedAt)}`
                  : 'Stripe client records + orphan proposals'
              }
            />
            <Tile label="Revenue Forecast" value={fmt(revenueForecast)} sub="Approved or Sent, not yet paid" />
            <Tile label="Outstanding Invoices" value={String(outstandingInvoices)} sub="Unpaid, not rejected" />
            <Tile label="Average Project Value" value={fmt(averageProjectValue)} sub={`Across ${paidProposals.length} paid deals`} />
          </div>
        </section>

        {/* Section 2: Pipeline Summary */}
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <SectionHead title="Pipeline Summary" />
            <a href="/admin/proposals" className="text-xs font-semibold" style={{ color: GOLD }}>
              View pipeline detail &rarr;
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Tile label="Assessments Submitted" value={String(assessmentsSubmitted)} />
            <Tile label="Proposals Sent" value={String(proposalsSent)} />
            <Tile label="Proposals Approved" value={String(proposalsApproved)} />
            <Tile label="Deals Closed" value={String(dealsClosed)} />
            <Tile label="Conversion Rate" value={conversionRate} sub="Assessments to closed" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
            <Tile label="Discovery Scheduled" value={String(discoveryScheduled)} sub="Client Records" accent="#1D4ED8" />
            <Tile label="Discovery Follow-Up" value={String(discoveryFollowUp)} sub="Needs outreach" accent="#92400E" />
            <Tile label="Onboarding > 7 days" value={String(clientsStuckOnboarding)} sub="Paid, not complete" accent="#991B1B" />
          </div>
        </section>

        {/* Section 3: Active Projects */}
        <section>
          <SectionHead title="Active Projects" />
          {activeProjects.length === 0 ? (
            <div className="bg-white border border-neutral-200 p-10 text-center">
              <p className="text-neutral-400 text-sm">No active projects.</p>
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Client Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Organization</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Package</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-neutral-500">Amount Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Portal Access</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Onboarding</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Lifecycle</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Discovery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {activeProjects.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50 transition">
                      <td className="px-4 py-3 font-medium text-neutral-900">{c.clientName}</td>
                      <td className="px-4 py-3 text-neutral-700">{c.organization || ''}</td>
                      <td className="px-4 py-3 text-neutral-700">{c.packagePurchased}</td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-900 whitespace-nowrap">{fmt(c.amountPaid)}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{c.portalAccessStatus}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{c.onboardingStatus}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{c.lifecycleStage || '—'}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{c.discoveryStatus || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 4: Partner Network */}
        <section>
          <SectionHead title="Partner Network" />
          {opportunities.length === 0 ? (
            <div className="bg-white border border-neutral-200 p-10 text-center">
              <p className="text-neutral-400 text-sm">No partner opportunities yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Partner Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Referral Organization</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-neutral-500">Project Value</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-neutral-500">Commission</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Date Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {opportunities.map((o) => (
                    <tr key={o.id} className="hover:bg-neutral-50 transition">
                      <td className="px-4 py-3 font-medium text-neutral-900">{o.partnerName}</td>
                      <td className="px-4 py-3 text-neutral-700">{o.referralOrganization}</td>
                      <td className="px-4 py-3 text-right text-neutral-900 whitespace-nowrap">{fmt(o.projectValue)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-900 whitespace-nowrap">{fmt(o.commissionAmount)}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{o.status}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">{fmtDate(o.dateCreated)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-neutral-200 bg-neutral-50">
                    <td className="px-4 py-3 font-bold text-xs uppercase tracking-wider" style={{ color: NAVY }} colSpan={3}>
                      Totals
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-neutral-500" colSpan={3}>
                      Owed {fmt(totalCommissionOwed)} &middot; Paid {fmt(totalCommissionPaid)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        {/* Section 5: Platform Snapshot */}
        <section>
          <SectionHead title="Platform Snapshot" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <PlatformTile
              title="EA Factory"
              metric="4"
              metricLabel="Active foundation phases"
              sub="Protocols, repos, project briefs, and skin briefs"
              href="/admin/ea-factory"
            />
            <PlatformTile
              title="Canadian Prospects Recruitment"
              metric={String(cprAthletes.length)}
              metricLabel="Total athletes"
              sub={`${cprActiveAthletes} active`}
              href={EA_SATELLITE_URLS.cpr}
            />
            <PlatformTile
              title="BrotherHub"
              metric={String(brotherHubMembers)}
              metricLabel="Chapter members"
              sub={`${brotherHubActiveChapters} active chapters`}
              href={EA_SATELLITE_URLS.brotherHub}
            />
            <PlatformTile
              title="SisterHub"
              metric={String(sisterHubMembers)}
              metricLabel="Chapter members"
              sub={`${sisterHubActiveChapters} active chapters`}
              href={EA_SATELLITE_URLS.sisterHub}
            />
            <PlatformTile
              title="EA Payments Engine"
              metric={String(proposals.length)}
              metricLabel="Total proposals"
              sub={`${proposalsPendingReview} pending review`}
              href="/admin/proposals"
            />
          </div>
        </section>

        {/* Section 6: Recent Activity */}
        <section>
          <SectionHead title="Recent Activity" />
          {activity.length === 0 ? (
            <div className="bg-white border border-neutral-200 p-10 text-center">
              <p className="text-neutral-400 text-sm">No recent activity.</p>
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 divide-y divide-neutral-100">
              {activity.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: ACTIVITY_DOT[item.type] }}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 w-24 shrink-0">
                    {ACTIVITY_LABEL[item.type]}
                  </span>
                  <span className="text-sm text-neutral-800 flex-1">{item.description}</span>
                  <span className="text-xs text-neutral-400 whitespace-nowrap">{fmtDate(item.date)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* EA Capture Engine — recent captures */}
        <section>
          <SectionHead title="EA Capture Engine — Recent Captures" />
          {captures.length === 0 ? (
            <div className="bg-white border border-neutral-200 p-8 text-center">
              <p className="text-sm text-neutral-500 mb-2">No captures yet.</p>
              <p className="text-xs text-neutral-400">
                Press ⌘K → Analyze URL or Quick Capture. View all scores in{' '}
                <a href="/admin/resource-radar" className="underline" style={{ color: GOLD }}>Resource Radar</a>.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">EA Fit</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Opportunity</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {captures.map((c) => (
                    <tr key={c.id} className="border-b border-neutral-100">
                      <td className="px-4 py-3 font-medium" style={{ color: NAVY }}>{c.title}</td>
                      <td className="px-4 py-3 text-neutral-600">{c.captureType}</td>
                      <td className="px-4 py-3 text-neutral-600">{c.source}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: GOLD }}>{c.eaFitScore ?? '—'}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: NAVY }}>{c.opportunityScore ?? '—'}</td>
                      <td className="px-4 py-3 text-neutral-600">{c.status}</td>
                      <td className="px-4 py-3 text-neutral-400">{fmtDate(c.dateCaptured)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </>
  );
}
