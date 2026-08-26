import Link from 'next/link';
import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import CreativeStudioClient from './CreativeStudioClient';

export const metadata = {
  title: 'Creative Studio · Efficiency Architects',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CreativeStudioPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) redirectToAdminLogin('/admin/creative-studio');

  return (
    <>
      <Link
        href="/admin/creative-studio/websites"
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 50,
          padding: '12px 18px',
          borderRadius: 999,
          background: '#111',
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          textDecoration: 'none',
          boxShadow: '0 14px 35px rgba(0,0,0,.18)',
        }}
      >
        Website Studio
      </Link>
      <CreativeStudioClient />
    </>
  );
}
