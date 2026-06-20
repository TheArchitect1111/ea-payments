import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { getCaptures } from '@/lib/capture-records';
import AdminLogin from '../master/AdminLogin';
import SimplifiWorkspaceClient from './SimplifiWorkspaceClient';

export const dynamic = 'force-dynamic';

export default async function SimplifiWorkspacePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return <AdminLogin />;
  }

  const captures = await getCaptures(25);
  return <SimplifiWorkspaceClient initialCaptures={captures} />;
}
