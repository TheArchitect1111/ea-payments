'use client';

import { usePathname } from 'next/navigation';
import RealmLoginCard from '@/components/auth/RealmLoginCard';
import { NAVY } from '@/lib/design-system';
import '../../portal/login/portal-login.css';

export default function AdminLogin() {
  const pathname = usePathname();
  const nextPath = pathname?.startsWith('/admin') ? pathname : '/admin/master';

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header style={{ backgroundColor: NAVY }} className="px-6 py-4">
        <div className="max-w-xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Efficiency Architects</p>
          <h1 className="text-xl font-extrabold uppercase tracking-widest text-white">Admin Access</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-5">
            <h2 className="text-base font-bold uppercase tracking-wider text-neutral-800">Master Control</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Enter your admin email — we send a one-tap login link. No password.
            </p>
          </div>
          <RealmLoginCard realm="admin" next={nextPath} showTitle={false} />
        </div>
      </main>
    </div>
  );
}
