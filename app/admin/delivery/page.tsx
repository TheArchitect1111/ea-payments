import { NAVY, GOLD } from '@/lib/design-system';
import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { getAllClientRecords } from '@/lib/airtable';
import {
  buildCustomerOperatingSystem,
  type CustomerOperatingRecord,
  type CustomerRiskLevel,
} from '@/lib/customer-operating-system';
import AdminLogin from '../proposals/AdminLogin';

export const dynamic = 'force-dynamic';

const CREAM = '#FAF8F3';

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDate(value?: string): string {
  const d = parseDate(value);
  if (!d) return 'Not set';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-neutral-200 bg-white p-5">
      <p className="text-3xl font-black" style={{ color: NAVY }}>{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p>
      {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

function RiskBadge({ risk }: { risk: CustomerRiskLevel }) {
  const cls =
    risk === 'critical'
      ? 'border-red-500/40 bg-red-50 text-red-700'
      : risk === 'high'
        ? 'border-amber-500/40 bg-amber-50 text-amber-700'
        : risk === 'medium'
          ? 'border-sky-500/40 bg-sky-50 text-sky-700'
          : 'border-emerald-500/40 bg-emerald-50 text-emerald-700';
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase ${cls}`}>{risk}</span>;
}

function HealthBadge({ record }: { record: CustomerOperatingRecord }) {
  const cls =
    record.health.status === 'At Risk'
      ? 'border-red-500/40 bg-red-50 text-red-700'
      : record.health.status === 'Watch'
        ? 'border-amber-500/40 bg-amber-50 text-amber-700'
        : 'border-emerald-500/40 bg-emerald-50 text-emerald-700';
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase ${cls}`}>
      {record.health.score} - {record.health.status}
    </span>
  );
}

export default async function ClientDeliveryBoardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) return <AdminLogin />;

  const clients = await getAllClientRecords();
  const rows = buildCustomerOperatingSystem(clients);
  const atRisk = rows.filter((r) => r.health.status === 'At Risk').length;
  const renewalDue = rows.filter((r) => r.renewalStatus === 'Due Soon' || r.renewalStatus === 'At Risk').length;
  const expansion = rows.filter((r) => r.expansionOpportunity !== 'None' || r.referralOpportunity !== 'None').length;
  const unassigned = rows.filter((r) => r.owner === 'Unassigned').length;

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            Customer Operating System
          </p>
          <h1 className="mt-2 text-3xl font-black" style={{ color: NAVY }}>Customer Success Dashboard</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-600">
            One operating view for every customer: lifecycle stage, owner, health, next milestone, learning progress,
            support status, renewal status, expansion opportunity, referral opportunity, and next communication.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-wider">
            <a href="/admin/master" className="text-neutral-500 hover:text-neutral-900">Master Control</a>
            <a href="/admin/content-requests" className="text-neutral-500 hover:text-neutral-900">Content Queue</a>
            <a href="/admin/enhancements" className="text-neutral-500 hover:text-neutral-900">Enhancements</a>
            <span className="text-neutral-500">SOP: docs/SEVEN-DAY-ONBOARDING-SOP.md</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Tile label="Operating customers" value={String(rows.length)} sub="Lead through advocate lifecycle" />
          <Tile label="At risk" value={String(atRisk)} sub="Health score below operating threshold" />
          <Tile label="Renewal watch" value={String(renewalDue)} sub="Due soon or at risk" />
          <Tile label="Expansion / referral" value={String(expansion)} sub="Healthy customers with next opportunity" />
          <Tile label="Owner gaps" value={String(unassigned)} sub="Needs assignment before scale" />
        </section>

        <section className="border border-[#C9A844]/40 p-5" style={{ backgroundColor: CREAM }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: GOLD }}>
                7-Day Operating Rhythm
              </p>
              <h2 className="mt-1 text-xl font-black" style={{ color: NAVY }}>First week after payment</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-700">
                Day 0-1: confirm payment, portal, owner, welcome, and kickoff path. Day 3: remove blockers.
                Day 7: confirm first value. Day 14: adoption and learning. Day 30: first success review.
                Monthly and quarterly: renewal, expansion, referral, and advocacy.
              </p>
            </div>
            <a
              href="/admin/delivery#delivery-table"
              className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white"
            >
              Review clients
            </a>
          </div>
        </section>

        <section id="delivery-table" className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                {[
                  'Risk',
                  'Health',
                  'Client',
                  'Owner',
                  'Lifecycle',
                  'Next milestone',
                  'Learning',
                  'Support',
                  'Renewal',
                  'Growth',
                  'Next communication',
                  'Next action',
                ].map((head) => (
                  <th key={head} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-sm text-neutral-500">
                    No customers are visible yet. When assessments, payments, portal activation, or lifecycle updates land in Client Records, this dashboard will populate.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.client.id} className="align-top hover:bg-neutral-50">
                    <td className="px-4 py-3"><RiskBadge risk={row.risk} /></td>
                    <td className="px-4 py-3"><HealthBadge record={row} /></td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-neutral-900">{row.client.clientName || 'Unnamed client'}</p>
                      <p className="text-xs text-neutral-500">{row.client.organization || row.client.email || row.client.id}</p>
                      <p className="text-xs text-neutral-500">{row.client.packagePurchased || 'Package not set'}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      <p>{row.owner}</p>
                      <p className="text-xs text-neutral-500">{row.ownerSource}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      <p className="font-bold" style={{ color: NAVY }}>{row.lifecycleStage}</p>
                      <p className="text-xs text-neutral-500">Airtable: {row.client.lifecycleStage || 'Not set'}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      <p>{row.nextSuccessMilestone}</p>
                      <p className="text-xs text-neutral-500">
                        {row.milestones.filter((m) => m.complete).length}/{row.milestones.length} complete
                      </p>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{row.learningProgress}%</td>
                    <td className="px-4 py-3 text-neutral-700">{row.supportStatus}</td>
                    <td className="px-4 py-3 text-neutral-700">{row.renewalStatus}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      <p>Expansion: {row.expansionOpportunity}</p>
                      <p className="text-xs text-neutral-500">Referral: {row.referralOpportunity}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      <p>{row.nextCommunication.cadence}</p>
                      <p className="text-xs text-neutral-500">{fmtDate(row.nextCommunication.dueDate)}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-800">{row.nextAction}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
