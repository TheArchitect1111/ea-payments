import { cookies } from 'next/headers';
import Link from 'next/link';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import AdminLogin from '../master/AdminLogin';
import DevicePreviewClient from './DevicePreviewClient';

export const dynamic = 'force-dynamic';

export default async function DevicePreviewPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) return <AdminLogin />;

  return (
    <main className="min-h-screen bg-[#f4f1ea] px-5 py-7 text-[#101828]">
      <div className="mx-auto max-w-[1500px]">
        <Link href="/admin/ea-factory" className="text-sm font-bold text-[#8a6a12]">Back to EA Factory</Link>
        <header className="mt-5 border border-[#dfd6c2] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#8a6a12]">EA Experience Quality</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Device Preview</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600">
            Review one EA page across phone, tablet, and desktop dimensions at the same time before approval or launch.
          </p>
        </header>
        <DevicePreviewClient />
      </div>
    </main>
  );
}
