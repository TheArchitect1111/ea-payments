import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import { buildMissionControlPayload } from '@/lib/mission-control-data';
import { MissionControlPanel } from './MissionControlPanel';
import { MasterQuickLinks } from './MasterQuickLinks';
import { NAVY, GOLD } from '@/lib/design-system';

export const dynamic = 'force-dynamic';

export default async function MasterPortalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    redirectToAdminLogin('/admin/master');
  }

  const mission = await buildMissionControlPayload({ role: 'executive', userName: 'Freedom' });
  const lastUpdated = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <>
      <div className="bg-white border-b border-neutral-200 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/images/ea-logo-hd.png"
              alt="Efficiency Architects"
              style={{ height: '60px', width: 'auto' }}
            />
            <div>
              <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>
                Mission Control
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                Ranked attention · not another dashboard
              </p>
            </div>
          </div>
          <p className="text-xs text-neutral-400">Last updated {lastUpdated}</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <MissionControlPanel mission={mission} mode="executive" />
        <MasterQuickLinks />
      </main>
    </>
  );
}
