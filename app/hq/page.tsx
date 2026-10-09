import { cookies } from 'next/headers';
import Link from 'next/link';
import { EA_ADMIN_COOKIE, parseAdminSession } from '@/lib/ea-admin-auth';
import { can, normalizeAdminRole } from '@/lib/rbac';
import PhoneHq from './PhoneHq';

export const dynamic = 'force-dynamic';

export default async function HqPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const cookieStore = await cookies();
  const session = parseAdminSession(cookieStore.get(EA_ADMIN_COOKIE)?.value);
  const { role } = await searchParams;
  const isClientSession = session?.role.toLowerCase() === 'client';
  const clientProjectId = session?.orgId && /^[a-z0-9][a-z0-9-]{0,48}$/.test(session.orgId) ? session.orgId : undefined;
  const clientMode = Boolean(isClientSession && role === 'client' && clientProjectId);
  const adminMode = Boolean(session && !isClientSession && can(normalizeAdminRole(session.role), 'admin:access'));
  if (!session || (!clientMode && !adminMode)) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0a0a0a] px-4 text-white">
        <section className="w-full max-w-md rounded-3xl border border-white/15 bg-[#141414] p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#df5a6c]">Private edit door</p>
          <h1 className="mt-3 text-3xl font-black">My Projects HQ</h1>
          <p className="mt-2 text-lg font-bold text-white/70">Fix Anything in 30s</p>
          <div className="mt-5 grid grid-cols-2 gap-2 text-left">
            <Link href="/client/tb3" className="grid min-h-20 content-center rounded-xl border border-white/15 bg-black/20 px-3"><span className="font-black">TB3</span><span className="text-xs text-white/55">tb3.online</span></Link>
            <Link href="/client/amanda" className="grid min-h-20 content-center rounded-xl border border-white/15 bg-black/20 px-3"><span className="font-black">Amanda&apos;s Page</span><span className="text-xs text-white/55">amandaspage.com</span></Link>
          </div>
          <button type="button" disabled className="mt-3 min-h-20 w-full rounded-xl border border-white/15 bg-white/5 font-bold text-white/60">＋ Add New Project</button>
          <p className="mt-5 text-sm text-white/60">Sign in with your EA admin account to open project shelves and the Film 5 Vault.</p>
          <Link href="/admin/login?next=%2Fhq" className="mt-5 grid min-h-20 place-items-center rounded-2xl bg-[#a51c30] px-4 font-black">Sign in to HQ</Link>
        </section>
      </main>
    );
  }
  return <PhoneHq clientMode={clientMode} clientProjectId={clientProjectId} />;
}
