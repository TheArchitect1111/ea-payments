import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import AdminLogin from '../../master/AdminLogin';
import QuickLaunchClient from './QuickLaunchClient';

export default async function QuickLaunchPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) return <AdminLogin />;

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F7F3EC] px-4 py-12 text-[#17130F]">
          <p className="mx-auto max-w-xl text-sm font-semibold">Loading Quick Launch…</p>
        </main>
      }
    >
      <QuickLaunchClient />
    </Suspense>
  );
}
