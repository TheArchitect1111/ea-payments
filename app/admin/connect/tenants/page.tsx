import { NAVY, GOLD } from '@/lib/design-system';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { getConnectSystemStatus, listConnectOrgs } from '@/lib/connect-store';
import ConnectTenantCreator from './ConnectTenantCreator';
import ConnectLaunchFinish from './ConnectLaunchFinish';

export const dynamic = 'force-dynamic';

const INK = '#111111';
const PAPER = '#fbfaf7';

export default async function ConnectTenantsPage() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(EA_ADMIN_COOKIE)?.value);
  if (!session) redirectToAdminLogin('/admin/connect/tenants');

  const [tenants, systemStatus] = await Promise.all([
    listConnectOrgs(),
    getConnectSystemStatus(),
  ]);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8" style={{ backgroundColor: PAPER, color: INK }}>
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 border-b border-neutral-200 pb-7 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: GOLD }}>Connect Tenants</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.95] sm:text-6xl">
              Tenant Creator
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-600">
              Launch a new Connect capture, guide, journey, QR destination, resource offer, and follow-up shell from one admin screen.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/connect" className="inline-flex min-h-11 items-center justify-center border border-neutral-300 px-5 text-xs font-black uppercase tracking-[0.14em] text-neutral-900">
              Connect Dashboard
            </Link>
            <Link href="/admin/master" className="inline-flex min-h-11 items-center justify-center border border-neutral-300 px-5 text-xs font-black uppercase tracking-[0.14em] text-neutral-900">
              Master Control
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-5">
          <ConnectLaunchFinish />
          <ConnectTenantCreator initialTenants={tenants} initialSystemStatus={systemStatus} />
        </section>
      </div>
    </main>
  );
}
