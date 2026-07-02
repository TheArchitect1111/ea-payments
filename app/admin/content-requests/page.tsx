import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import { getAllContentRequests } from '@/lib/airtable';
import ContentRequestsDashboard from './ContentRequestsDashboard';

export const dynamic = 'force-dynamic';

export default async function ContentRequestsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) redirectToAdminLogin('/admin/content-requests');
  const requests = await getAllContentRequests();
  return <ContentRequestsDashboard initialData={requests} />;
}
