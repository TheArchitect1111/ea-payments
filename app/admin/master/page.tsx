import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import {
  getProposalsWithAssessments,
  getAllAssessments,
  getAllClientRecords,
  getPartnerRecords,
  getCPRAthletes,
  getBrotherHubChapters,
} from '@/lib/airtable';
import { getOpportunities } from '@/lib/partner-network';
import AdminLogin from './AdminLogin';

export const dynamic = 'force-dynamic';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';
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

  const [assessments, proposals, clientRecords, partnerRecords, opportunities, cprAthletes, brotherHubChapters] =
    await Promise.all([
      getAllAssessments(),
      getProposalsWithAssessments(),
      getAllClientRecords(),
      getPartnerRecords(),
      getOpportunities(),
      getCPRAthletes(),
      getBrotherHubChapters(),
    ]);

  // Revenue Overview
  const paidProposals = proposals.filter((p) => p.status === 'Approved & Paid');
  const totalRevenueCollected = paidProposals.reduce((sum, p) => sum + (p.recommendedFee || 0), 0);
  const revenueForecast = proposals
    .filter((p) => p.status === 'Approved' || p.status === 'Sent')
    .reduce((sum, p) => sum + (p.recommendedFee || 0), 0);
  const outstandingInvoices = proposals.filter(
    (p) => p.paymentStatus === 'Unpaid' && p.status !== 'Rejected'
  ).length;
  const averageProjectValue =
    paidProposals.length > 0 ? totalRevenueCollected / paidProposals.length : 0;

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
  const proposalsPendingReview = proposals.filter((p) => p.status === 'Pending Review').length;

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
    <div className="min-h-screen bg-neutral-50">
      <header style={{ backgroundColor: NAVY }} className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
              Efficiency Architects
            </p>
            <h1 className="text-xl font-extrabold uppercase tracking-widest text-white">
              Master Control
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="/admin/dashboard" className="text-xs font-semibold text-blue-200 hover:text-white transition">
              Pipeline
            </a>
            <a href="/admin/proposals" className="text-xs font-semibold text-blue-200 hover:text-white transition">
              Proposals
            </a>
            <a href="/admin/commissions" className="text-xs font-semibold text-blue-200 hover:text-white transition">
              Commissions
            </a>
            <a href="/api/admin/logout" className="text-xs font-semibold text-blue-200 hover:text-white transition">
              Sign Out
            </a>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-neutral-200 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <img src="/images/ea-logo.png" alt="Efficiency Architects" style={{ height: '48px', width: 'auto' }} />
            <div>
              <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>
                EA Master Control
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                Everything. One place.
              </p>
            </div>
          </div>
          <p className="text-xs text-neutral-400">Last updated {lastUpdated}</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* Section 1: Revenue Overview */}
        <section>
          <SectionHead title="Revenue Overview" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Tile label="Total Revenue Collected" value={fmt(totalRevenueCollected)} sub="Approved & Paid proposals" />
            <Tile label="Revenue Forecast" value={fmt(revenueForecast)} sub="Approved or Sent, not yet paid" />
            <Tile label="Outstanding Invoices" value={String(outstandingInvoices)} sub="Unpaid, not rejected" />
            <Tile label="Average Project Value" value={fmt(averageProjectValue)} sub={`Across ${paidProposals.length} paid deals`} />
          </div>
        </section>

        {/* Section 2: Pipeline Summary */}
        <section>
          <SectionHead title="Pipeline Summary" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Tile label="Assessments Submitted" value={String(assessmentsSubmitted)} />
            <Tile label="Proposals Sent" value={String(proposalsSent)} />
            <Tile label="Proposals Approved" value={String(proposalsApproved)} />
            <Tile label="Deals Closed" value={String(dealsClosed)} />
            <Tile label="Conversion Rate" value={conversionRate} sub="Assessments to closed" />
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <PlatformTile
              title="Canadian Prospects Recruitment"
              metric={String(cprAthletes.length)}
              metricLabel="Total athletes"
              sub={`${cprActiveAthletes} active`}
              href="https://canadian-prospects-recruitment.vercel.app"
            />
            <PlatformTile
              title="BrotherHub"
              metric={String(brotherHubMembers)}
              metricLabel="Total chapter members"
              sub={`${brotherHubActiveChapters} active chapters`}
              href="https://brother-hub.vercel.app"
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

      </main>
    </div>
  );
}
