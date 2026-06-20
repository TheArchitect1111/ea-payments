import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { getResourceCaptures } from '@/lib/capture-records';
import AdminLogin from '../master/AdminLogin';
import ResourceRadarClient from './ResourceRadarClient';

export const dynamic = 'force-dynamic';

export default async function ResourceRadarPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return <AdminLogin />;
  }

  const captures = await getResourceCaptures(50);
  return <ResourceRadarClient initialCaptures={captures} />;
}
