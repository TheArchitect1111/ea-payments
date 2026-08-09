import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import VideoTestClient from './VideoTestClient';

export const dynamic = 'force-dynamic';

export default async function VideoTestPage() {
  const token = (await cookies()).get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    redirectToAdminLogin('/admin/video-test');
  }

  return <VideoTestClient />;
}
