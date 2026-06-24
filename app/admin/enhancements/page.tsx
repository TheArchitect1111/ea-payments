import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import { getAllEnhancementRequests } from '@/lib/airtable';
import EnhancementsDashboard from './EnhancementsDashboard';

export const dynamic = 'force-dynamic';

export default async function EnhancementsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) redirectToAdminLogin('/admin/enhancements');
  const requests = await getAllEnhancementRequests();
  return <EnhancementsDashboard initialData={requests} />;
}
