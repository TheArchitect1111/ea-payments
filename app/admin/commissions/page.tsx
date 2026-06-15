import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { getOpportunities } from '@/lib/partner-network';
import AdminLogin from './AdminLogin';
import CommissionsDashboard from './CommissionsDashboard';

export const dynamic = 'force-dynamic';

export default async function CommissionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return <AdminLogin />;
  }

  const opportunities = await getOpportunities();
  return <CommissionsDashboard initialData={opportunities} />;
}
