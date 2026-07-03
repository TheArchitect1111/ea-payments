import AdminLogin from '../../master/AdminLogin';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';
import SkinFactoryDashboardClient from './SkinFactoryDashboardClient';

export const dynamic = 'force-dynamic';

export default async function SkinFactoryDashboardPage() {
  if (!(await hasAdminPageAccess())) return <AdminLogin />;
  return <SkinFactoryDashboardClient />;
}
