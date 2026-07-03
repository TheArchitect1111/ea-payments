import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import MediaLibraryClient from './MediaLibraryClient';

export const metadata = {
  title: 'Media Library · Creative Studio',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CreativeStudioMediaPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) redirectToAdminLogin('/admin/creative-studio/media');

  return <MediaLibraryClient />;
}
