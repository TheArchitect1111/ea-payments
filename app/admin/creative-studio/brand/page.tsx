import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import BrandEditorClient from './BrandEditorClient';

export const metadata = {
  title: 'Brand Profile · Creative Studio',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function BrandProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) redirectToAdminLogin('/admin/creative-studio/brand');

  return <BrandEditorClient />;
}
