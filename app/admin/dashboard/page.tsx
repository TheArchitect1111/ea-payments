import { NAVY, GOLD } from '@/lib/design-system';
import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import {
  getProposalsWithAssessments,
  getAllAssessments,
  getAllClientRecords,
} from '@/lib/airtable';

export const dynamic = 'force-dynamic';

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

function Tile({ label, value, sub, accent = NAVY }: TileProps) {
  return (
    <div
      className="bg-white border border-neutral-200 p-5"
      style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
    >
      <p className="text-2xl font-extrabold leading-tight" style={{ color: NAVY }}>
        {value}
      </p>
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mt-1">
        {label}
      </p>
      {sub && (
        <p className="text-xs text-neutral-400 mt-1 leading-snug">{sub}</p>
      )}
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <p
      className="text-xs font-bold uppercase tracking-widest mb-3"
      style={{ color: GOLD }}
    >
      {title}
    </p>
  );
}

const STATUS_DOT: Record<string, string> = {
  'Pending Review':           '#92400E',
  'Approved':                 '#065F46',
  'Sent':                     '#1D4ED8',
  'Rejected':                 '#991B1B',
  'Discovery Call Requested': '#5B21B6',
  'Approved & Paid':          '#166534',
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    redirectToAdminLogin('/admin/dashboard');
  }

  const [assessments, proposals, clientRecords] = await Promise.all([
    getAllAssessments(),
    getProposalsWithAssessments(),
    getAllClientRecords(),
  ]);

  // Date boundaries
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Assessment metrics
  const assessmentsTotal = assessments.length;
  const assessmentsThisWeek = assessments.filter(
    (a) => new Date(a.createdTime) >= weekAgo
  ).length;
  const assessmentsThisMonth = assessments.filter(
    (a) => new Date(a.createdTime) >= monthStart
  ).length;

  // Proposal metrics
  const sentStatuses = new Set(['Approved', 'Sent', 'Approved & Paid']);
  const approvedStatuses = new Set(['Approved', 'Approved & Paid']);

  const proposalsSent = proposals.filter((p) => sentStatuses.has(p.status)).length;
  const proposalsApproved = proposals.filter((p) => approvedStatuses.has(p.status)).length;
  const proposalsPaid = proposals.filter((p) => p.status === 'Approved & Paid').length;
  const pendingPayments = proposals.filter(
    (p) => p.status === 'Approved' || p.status === 'Sent'
  ).length;

  // Revenue metrics
  const revenueForecast = proposals
    .filter((p) => p.status === 'Approved' || p.status === 'Sent')
    .reduce((sum, p) => sum + (p.recommendedFee || 0), 0);

  const revenueCollected = proposals
    .filter((p) => p.status === 'Approved & Paid')
    .reduce((sum, p) => sum + (p.recommendedFee || 0), 0);

  // Active projects: client records not yet completed
  const activeProjects = clientRecords.filter(
    (c) => c.onboardingStatus !== 'Complete'
  ).length;

  // Conversion rates
  const conversionAssessmentToSent = pct(proposalsSent, assessmentsTotal);
  const conversionSentToPaid = pct(proposalsPaid, proposalsSent);

  // Recent proposals: sort by proposalId descending (PROP-XXXX is sequential)
  const recentProposals = [...proposals]
    .sort((a, b) => b.proposalId.localeCompare(a.proposalId))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header style={{ backgroundColor: NAVY }} className="px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
              Efficiency Architects
            </p>
            <h1 className="text-xl font-extrabold uppercase tracking-widest text-white">
              Pipeline Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/admin/master"
              className="text-xs font-semibold text-blue-200 hover:text-white transition"
            >
              Master
            </a>
            <a
              href="/admin/proposals"
              className="text-xs font-semibold text-blue-200 hover:text-white transition"
            >
              Proposals
            </a>
            <a
              href="/admin/commissions"
              className="text-xs font-semibold text-blue-200 hover:text-white transition"
            >
              Commissions
            </a>
            <a
              href="/api/admin/logout"
              className="text-xs font-semibold text-blue-200 hover:text-white transition"
            >
              Sign Out
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">

        {/* Pipeline overview */}
        <section>
          <SectionHead title="Pipeline Overview" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Tile
              label="Assessments Submitted"
              value={String(assessmentsTotal)}
              sub={`${assessmentsThisWeek} this week · ${assessmentsThisMonth} this month`}
              accent={GOLD}
            />
            <Tile
              label="Proposals Sent"
              value={String(proposalsSent)}
              sub="Approved + Sent + Paid"
              accent="#1D4ED8"
            />
            <Tile
              label="Proposals Approved"
              value={String(proposalsApproved)}
              sub="Approved + Paid"
              accent="#065F46"
            />
            <Tile
              label="Pending Payments"
              value={String(pendingPayments)}
              sub="Approved or Sent, not yet paid"
              accent="#92400E"
            />
          </div>
        </section>

        {/* Revenue */}
        <section>
          <SectionHead title="Revenue" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Tile
              label="Revenue Forecast"
              value={fmt(revenueForecast)}
              sub="Sum of approved and sent proposals not yet paid"
              accent={GOLD}
            />
            <Tile
              label="Revenue Collected"
              value={fmt(revenueCollected)}
              sub="Sum of paid proposals"
              accent="#065F46"
            />
            <Tile
              label="Active Projects"
              value={String(activeProjects)}
              sub="Client records with onboarding not complete"
              accent="#1D4ED8"
            />
          </div>
        </section>

        {/* Conversion rates */}
        <section>
          <SectionHead title="Conversion" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Tile
              label="Assessment to Proposal Sent"
              value={conversionAssessmentToSent}
              sub={`${proposalsSent} sent from ${assessmentsTotal} assessments`}
              accent={GOLD}
            />
            <Tile
              label="Proposal Sent to Paid"
              value={conversionSentToPaid}
              sub={`${proposalsPaid} paid from ${proposalsSent} sent`}
              accent="#065F46"
            />
          </div>
        </section>

        {/* Recent proposals */}
        <section>
          <SectionHead title="Recent Proposals" />
          {recentProposals.length === 0 ? (
            <div className="bg-white border border-neutral-200 p-10 text-center">
              <p className="text-neutral-400 text-sm">No proposals yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Business
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Fee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Approved
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentProposals.map((p) => {
                    const dotColor = STATUS_DOT[p.status] ?? '#6B7280';
                    return (
                      <tr key={p.id} className="hover:bg-neutral-50 transition">
                        <td className="px-4 py-3 text-xs font-mono text-neutral-500 whitespace-nowrap">
                          {p.proposalId}
                        </td>
                        <td className="px-4 py-3 font-medium text-neutral-900 max-w-[180px] truncate">
                          {p.businessName || p.contactName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: dotColor }}
                            />
                            <span className="text-xs text-neutral-700">{p.status}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-neutral-900 whitespace-nowrap">
                          {p.recommendedFee ? fmt(p.recommendedFee) : '$0'}
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">
                          {p.createdTime ? fmtDate(p.createdTime) : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">
                          {p.dateApproved ? fmtDate(p.dateApproved) : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
