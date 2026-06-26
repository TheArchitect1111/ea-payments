import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { listConnections, listConnectProfiles } from '@/lib/connect-store';
import AdminLogin from '../master/AdminLogin';
import ConnectDashboardClient from './ConnectDashboardClient';
import './connect-admin.css';

export const dynamic = 'force-dynamic';

export default async function AdminConnectPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) return <AdminLogin />;

  const [connections, profiles] = await Promise.all([listConnections(200), listConnectProfiles()]);
  return <ConnectDashboardClient connections={connections} profiles={profiles} />;
}
