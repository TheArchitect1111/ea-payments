import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import WebsiteStudioClient from './WebsiteStudioClient';

export const metadata = {
  title: 'Website Studio · Efficiency Architects',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function WebsitesStudioPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) redirectToAdminLogin('/admin/creative-studio/websites');

  return <WebsiteStudioClient />;
}
