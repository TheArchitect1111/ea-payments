import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { getAllClientRecords } from '@/lib/airtable';
import type { ClientRecordSummary } from '@/lib/airtable';
import AdminLogin from '../proposals/AdminLogin';

export const dynamic = 'force-dynamic';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';
const CREAM = '#FAF8F3';

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

type DeliveryRow = ClientRecordSummary & {
  anchorDate?: string;
  ageDays: number | null;
  nextAction: string;
  dueDate?: string;
  risk: RiskLevel;
  owner: string;
};

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

function addDays(value: string | undefined, days: number): string | undefined {
  const d = parseDate(value);
  if (!d) return undefined;
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function ageInDays(value?: string): number | null {
  const d = parseDate(value);
  if (!d) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
}

function isActiveClient(client: ClientRecordSummary): boolean {
  return (
    client.amountPaid > 0 ||
    ['Onboarding', 'Build', 'Launch', 'Adoption', 'Optimization'].includes(client.lifecycleStage ?? '')
  );
}

function nextActionFor(client: ClientRecordSummary): { action: string; offset: number; risk: RiskLevel } {
  const onboarding = client.onboardingStatus || 'Not Started';
  const portal = client.portalAccessStatus || 'Pending';
  const build = client.buildStatus || 'Not Started';
  const launch = client.launchStatus || 'Not Scheduled';

  if (portal !== 'Active') {
    return { action: 'Confirm portal access and password handoff', offset: 1, risk: 'high' };
  }
  if (onboarding === 'Not Started') {
    return { action: 'Start onboarding, assign owner, send welcome confirmation', offset: 1, risk: 'high' };
  }
  if (onboarding === 'In Progress') {
    return { action: 'Send docs, schedule kickoff, confirm first-value target', offset: 2, risk: 'medium' };
  }
  if (onboarding === 'Docs Sent') {
    return { action: 'Follow up for signed docs and kickoff readiness', offset: 3, risk: 'medium' };
  }
  if (onboarding === 'Docs Signed' && build === 'Not Started') {
    return { action: 'Open build plan and assign first milestone', offset: 5, risk: 'medium' };
  }
  if (build === 'In Progress' || build === 'Awaiting Client' || build === 'Client Review') {
    return { action: `Advance build status: ${build}`, offset: 7, risk: build === 'Awaiting Client' ? 'medium' : 'low' };
  }
  if (launch === 'Not Scheduled') {
    return { action: 'Schedule launch/adoption checkpoint', offset: 7, risk: 'low' };
  }
  return { action: 'Run weekly client success review', offset: 7, risk: 'low' };
}

function buildRows(clients: ClientRecordSummary[]): DeliveryRow[] {
  return clients
    .filter(isActiveClient)
    .map((client) => {
      const anchorDate = client.paymentReceivedAt ?? client.createdTime;
      const next = nextActionFor(client);
      const ageDays = ageInDays(anchorDate);
      const overdue = ageDays !== null && ageDays > 7 && client.onboardingStatus !== 'Complete';
      const risk: RiskLevel = overdue ? 'critical' : next.risk;

      return {
        ...client,
        anchorDate,
        ageDays,
        nextAction: next.action,
        dueDate: addDays(anchorDate, next.offset),
        risk,
        owner: 'Unassigned',
      };
    })
    .sort((a, b) => {
      const order: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      if (order[a.risk] !== order[b.risk]) return order[a.risk] - order[b.risk];
      return (b.ageDays ?? -1) - (a.ageDays ?? -1);
    });
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

function RiskBadge({ risk }: { risk: RiskLevel }) {
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

export default async function ClientDeliveryBoardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) return <AdminLogin />;

  const clients = await getAllClientRecords();
  const rows = buildRows(clients);
  const stuck = rows.filter((r) => r.ageDays !== null && r.ageDays > 7 && r.onboardingStatus !== 'Complete').length;
  const portalPending = rows.filter((r) => r.portalAccessStatus !== 'Active').length;
  const unassigned = rows.filter((r) => r.owner === 'Unassigned').length;

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            Scale Readiness
          </p>
          <h1 className="mt-2 text-3xl font-black" style={{ color: NAVY }}>Client Delivery Board</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-600">
            One operating view for active clients: onboarding status, portal access, lifecycle stage, next action,
            due date, and scale risk. This is the board to open every morning when EA has multiple clients moving at once.
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
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Active clients" value={String(rows.length)} sub="Paid or in delivery lifecycle" />
          <Tile label="Onboarding > 7 days" value={String(stuck)} sub="Not yet complete" />
          <Tile label="Portal gaps" value={String(portalPending)} sub="Portal not marked active" />
          <Tile label="Owner gaps" value={String(unassigned)} sub="Requires named delivery owner field" />
        </section>

        <section className="border border-[#C9A844]/40 p-5" style={{ backgroundColor: CREAM }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: GOLD }}>
                7-Day Operating Rhythm
              </p>
              <h2 className="mt-1 text-xl font-black" style={{ color: NAVY }}>First week after payment</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-700">
                Day 0-1: confirm payment, portal, owner, welcome, and kickoff path. Day 2-3: docs and discovery.
                Day 4-5: first-value plan. Day 6-7: Architect Review prep and client success checkpoint.
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
                  'Client',
                  'Package',
                  'Owner',
                  'Lifecycle',
                  'Onboarding',
                  'Portal',
                  'Age',
                  'Next action',
                  'Due',
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
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-neutral-500">
                    No active clients yet. When payments or lifecycle updates land in Client Records, this board will populate.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="align-top hover:bg-neutral-50">
                    <td className="px-4 py-3"><RiskBadge risk={row.risk} /></td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-neutral-900">{row.clientName || 'Unnamed client'}</p>
                      <p className="text-xs text-neutral-500">{row.organization || row.email || row.id}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{row.packagePurchased || 'Not set'}</td>
                    <td className="px-4 py-3 text-neutral-700">{row.owner}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      <p>{row.lifecycleStage || 'Not set'}</p>
                      <p className="text-xs text-neutral-500">Build: {row.buildStatus || 'Not set'}</p>
                      <p className="text-xs text-neutral-500">Launch: {row.launchStatus || 'Not set'}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{row.onboardingStatus || 'Not Started'}</td>
                    <td className="px-4 py-3 text-neutral-700">{row.portalAccessStatus || 'Pending'}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      {row.ageDays === null ? 'Unknown' : `${row.ageDays}d`}
                      <p className="text-xs text-neutral-500">{fmtDate(row.anchorDate)}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-800">{row.nextAction}</td>
                    <td className="px-4 py-3 text-neutral-700">{fmtDate(row.dueDate)}</td>
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
