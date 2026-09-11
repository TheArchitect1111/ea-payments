import Link from 'next/link';
import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import { getOperationsCommandCenter, type OperationsHealth } from '@/lib/operations-command-center';
import { buildPlatformOpsReport } from '@/lib/platform-ops';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const HEALTH_UI: Record<OperationsHealth, { label: string; dot: string; bg: string; border: string; text: string }> = {
  healthy: { label: 'Healthy', dot: '🟢', bg: '#EEF8F0', border: '#B9DFC2', text: '#185C2A' },
  attention: { label: 'Attention', dot: '🟡', bg: '#FFF8E6', border: '#E8D49A', text: '#72520A' },
  'action-required': { label: 'Action Required', dot: '🔴', bg: '#FFF0ED', border: '#E7B5AA', text: '#842D20' },
};

const SUBSYSTEM_STYLE: Record<string, { dot: string; bg: string; text: string }> = {
  healthy: { dot: '🟢', bg: '#EEF8F0', text: '#185C2A' },
  degraded: { dot: '🟡', bg: '#FFF8E6', text: '#72520A' },
  critical: { dot: '🔴', bg: '#FFF0ED', text: '#842D20' },
  unknown: { dot: '⚪', bg: '#F3F1EC', text: '#625F56' },
  not_configured: { dot: '🟡', bg: '#FFF8E6', text: '#72520A' },
};

export default async function OperationsCommandCenterPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) redirectToAdminLogin('/admin/operations');

  const [records, platform] = await Promise.all([
    getOperationsCommandCenter(),
    buildPlatformOpsReport({ probeRoutes: true, verifyBackup: true }).catch(() => null),
  ]);

  const totals = records.reduce(
    (acc, record) => {
      acc[record.health] += 1;
      return acc;
    },
    { healthy: 0, attention: 0, 'action-required': 0 } as Record<OperationsHealth, number>,
  );
  const checkedAt = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <main className="min-h-screen bg-[#F6F4EF] px-4 py-6 text-[#171713] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="rounded-[28px] border border-[#E5E0D5] bg-white p-6 shadow-[0_18px_60px_rgba(50,45,35,0.06)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="m-0 text-xs font-extrabold uppercase tracking-[0.18em] text-[#80651D]">Efficiency Architects · Operations</p>
              <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">Command Center</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#625F56] sm:text-lg">
                What is healthy, what needs attention, and what requires action. Live routes, platform readiness, monitoring, backups, agents, canonical ownership and Control Plane readiness are checked without guessing missing information.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <Link href="/admin/master" className="rounded-full border border-[#D8D1C2] bg-[#FAF8F3] px-4 py-2 text-[#4E493F] no-underline">Executive Home</Link>
              <Link href="/admin/dashboard" className="rounded-full border border-[#D8D1C2] bg-[#FAF8F3] px-4 py-2 text-[#4E493F] no-underline">Pipeline</Link>
              <Link href="/admin/client-registry" className="rounded-full border border-[#D8D1C2] bg-[#FAF8F3] px-4 py-2 text-[#4E493F] no-underline">Registry</Link>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {(Object.keys(HEALTH_UI) as OperationsHealth[]).map((health) => {
              const ui = HEALTH_UI[health];
              return (
                <div key={health} className="rounded-[20px] border p-5" style={{ background: ui.bg, borderColor: ui.border }}>
                  <p className="m-0 text-sm font-bold" style={{ color: ui.text }}>{ui.dot} {ui.label}</p>
                  <p className="mt-2 text-4xl font-black" style={{ color: ui.text }}>{totals[health]}</p>
                </div>
              );
            })}
          </div>
          <p className="mb-0 mt-4 text-xs text-[#898378]">Last refreshed: {checkedAt}. Refresh this page to rerun current health checks.</p>
        </header>

        <section className="mt-6 rounded-[26px] border border-[#E5E0D5] bg-white p-5 shadow-[0_12px_34px_rgba(50,45,35,0.045)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#80651D]">Platform health engine</p>
              <h2 className="mt-1 font-serif text-3xl font-semibold">EA infrastructure</h2>
            </div>
            <div className={`rounded-full px-4 py-2 text-sm font-extrabold ${platform?.ok ? 'bg-[#EEF8F0] text-[#185C2A]' : 'bg-[#FFF0ED] text-[#842D20]'}`}>
              {platform?.ok ? '🟢 Platform ready' : platform ? '🔴 Platform needs action' : '🟡 Health engine unavailable'}
            </div>
          </div>

          {platform ? (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[18px] bg-[#F8F6F1] p-4"><p className="m-0 text-[11px] font-extrabold uppercase tracking-wider text-[#888176]">Readiness</p><p className="mt-1 text-2xl font-black">{platform.readinessScore}%</p></div>
                <div className="rounded-[18px] bg-[#F8F6F1] p-4"><p className="m-0 text-[11px] font-extrabold uppercase tracking-wider text-[#888176]">Launch blockers</p><p className="mt-1 text-2xl font-black">{platform.launchBlockers}</p></div>
                <div className="rounded-[18px] bg-[#F8F6F1] p-4"><p className="m-0 text-[11px] font-extrabold uppercase tracking-wider text-[#888176]">Agents</p><p className="mt-1 text-2xl font-black">{platform.agents.length}</p></div>
                <div className="rounded-[18px] bg-[#F8F6F1] p-4"><p className="m-0 text-[11px] font-extrabold uppercase tracking-wider text-[#888176]">Secret issues</p><p className="mt-1 text-2xl font-black">{platform.monitoring.productionSecretIssues.length}</p></div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {platform.subsystems.map((subsystem) => {
                  const style = SUBSYSTEM_STYLE[subsystem.status] ?? SUBSYSTEM_STYLE.unknown;
                  return (
                    <div key={subsystem.id} className="rounded-[18px] p-4" style={{ background: style.bg, color: style.text }}>
                      <p className="m-0 text-sm font-extrabold">{style.dot} {subsystem.name}</p>
                      <p className="mb-0 mt-2 text-sm leading-6">{subsystem.message}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[16px] border border-[#E5E0D5] p-4"><strong>Sentry / GlitchTip</strong><p className="mb-0 mt-1 text-sm text-[#625F56]">{platform.monitoring.sentryConfigured ? 'Configured' : 'Not configured'}</p></div>
                <div className="rounded-[16px] border border-[#E5E0D5] p-4"><strong>Uptime monitoring</strong><p className="mb-0 mt-1 text-sm text-[#625F56]">{platform.monitoring.uptimeDashboardConfigured ? 'Configured' : 'Not configured'}</p></div>
                <div className="rounded-[16px] border border-[#E5E0D5] p-4"><strong>Backup destination</strong><p className="mb-0 mt-1 text-sm text-[#625F56]">{platform.monitoring.backupDestinationConfigured ? (platform.monitoring.backupDestinationReachable === false ? 'Configured · unreachable' : 'Configured') : 'Not configured'}</p></div>
              </div>

              {platform.recommendedNextAction && <div className="mt-4 rounded-[16px] bg-[#F3F0E7] p-4 text-sm"><strong>Platform next action:</strong> {platform.recommendedNextAction}</div>}
            </>
          ) : (
            <div className="mt-5 rounded-[16px] bg-[#FFF8E6] p-4 text-[#72520A]">The platform health engine did not return a report. Client-level health remains visible below, and this state requires investigation.</div>
          )}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {records
            .sort((a, b) => {
              const rank: Record<OperationsHealth, number> = { 'action-required': 0, attention: 1, healthy: 2 };
              return rank[a.health] - rank[b.health] || a.name.localeCompare(b.name);
            })
            .map((record) => {
              const ui = HEALTH_UI[record.health];
              return (
                <article key={record.id} className="rounded-[24px] border bg-white p-5 shadow-[0_12px_34px_rgba(50,45,35,0.045)] sm:p-6" style={{ borderColor: record.health === 'healthy' ? '#E5E0D5' : ui.border }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#888176]">{record.id} · {record.kind}</p>
                      <h2 className="mt-1 font-serif text-2xl font-semibold tracking-[-0.02em]">{record.name}</h2>
                    </div>
                    <span className="rounded-full px-3 py-2 text-xs font-extrabold" style={{ background: ui.bg, color: ui.text }}>{ui.dot} {ui.label}</span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[16px] bg-[#F8F6F1] p-4">
                      <p className="m-0 text-[11px] font-extrabold uppercase tracking-wider text-[#888176]">Live</p>
                      <p className="mt-1 font-bold">{record.liveCheck === 'online' ? `Online${record.liveStatusCode ? ` · HTTP ${record.liveStatusCode}` : ''}` : record.liveCheck === 'offline' ? 'Offline / check failed' : 'No public route required'}</p>
                    </div>
                    <div className="rounded-[16px] bg-[#F8F6F1] p-4">
                      <p className="m-0 text-[11px] font-extrabold uppercase tracking-wider text-[#888176]">Monitoring</p>
                      <p className="mt-1 font-bold">{record.monitoring}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm leading-6 text-[#585349]">
                    <p className="m-0"><strong className="text-[#25231F]">Control Plane:</strong> {record.controlPlane}</p>
                    <p className="m-0"><strong className="text-[#25231F]">GitHub:</strong> {record.githubRepo ?? 'Not resolved / not applicable'}</p>
                    <p className="m-0"><strong className="text-[#25231F]">Vercel:</strong> {record.vercelProjects.join(', ') || 'Not applicable'}</p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {record.website && <a href={record.website} target="_blank" rel="noreferrer" className="rounded-full bg-[#1F2A44] px-4 py-2 text-sm font-bold text-white no-underline">Open website ↗</a>}
                    {record.portal && <a href={record.portal} target="_blank" rel="noreferrer" className="rounded-full bg-[#EFE9D8] px-4 py-2 text-sm font-bold text-[#51400D] no-underline">Open portal ↗</a>}
                  </div>

                  {record.nextAction && (
                    <div className="mt-5 rounded-[16px] border px-4 py-3" style={{ background: ui.bg, borderColor: ui.border, color: ui.text }}>
                      <p className="m-0 text-xs font-extrabold uppercase tracking-wider">Next action</p>
                      <p className="mb-0 mt-1 font-semibold">{record.nextAction}</p>
                    </div>
                  )}
                </article>
              );
            })}
        </section>
      </div>
    </main>
  );
}
