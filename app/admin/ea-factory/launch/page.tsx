import { CREAM } from '@/lib/design-system';
import AdminLogin from '../../master/AdminLogin';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';
import LaunchClient from './LaunchClient';

export const dynamic = 'force-dynamic';

export default async function FactoryPhoneLaunchPage() {
  if (!(await hasAdminPageAccess())) return <AdminLogin />;

  return (
    <main className="min-h-screen" style={{ backgroundColor: CREAM }}>
      <LaunchClient />
    </main>
  );
}
