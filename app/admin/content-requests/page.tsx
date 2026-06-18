import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { getAllContentRequests } from '@/lib/airtable';
import AdminLogin from '../proposals/AdminLogin';
import ContentRequestsDashboard from './ContentRequestsDashboard';

export const dynamic = 'force-dynamic';

export default async function ContentRequestsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) return <AdminLogin />;
  const requests = await getAllContentRequests();
  return <ContentRequestsDashboard initialData={requests} />;
}
