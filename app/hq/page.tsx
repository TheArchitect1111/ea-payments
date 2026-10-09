import { cookies } from 'next/headers';
import Link from 'next/link';
import { EA_ADMIN_COOKIE, parseAdminSession } from '@/lib/ea-admin-auth';
import { can, normalizeAdminRole } from '@/lib/rbac';
import PhoneHq from './PhoneHq';

export const dynamic = 'force-dynamic';

export default async function HqPage() {
  const cookieStore = await cookies();
  const session = parseAdminSession(cookieStore.get(EA_ADMIN_COOKIE)?.value);
  if (!session || !can(normalizeAdminRole(session.role), 'admin:access')) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0a0a0a] px-4 text-white">
        <section className="w-full max-w-md rounded-3xl border border-white/15 bg-[#141414] p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#df5a6c]">Private edit door</p>
          <h1 className="mt-3 text-3xl font-black">My Projects HQ</h1>
          <p className="mt-2 text-lg font-bold text-white/70">Fix Anything in 30s</p>
          <p className="mt-5 text-sm text-white/60">Sign in with your EA admin account to open project shelves and the Film 5 Vault.</p>
          <Link href="/admin/login?next=%2Fhq" className="mt-5 grid min-h-20 place-items-center rounded-2xl bg-[#a51c30] px-4 font-black">Sign in to HQ</Link>
        </section>
      </main>
    );
  }
  return <PhoneHq />;
}
