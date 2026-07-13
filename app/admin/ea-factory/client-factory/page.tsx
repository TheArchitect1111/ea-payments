import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { listClientFactoryPresets } from '@/lib/platform/client-factory';
import { platformStoreConfigured } from '@/lib/platform-store';
import AdminLogin from '../../master/AdminLogin';
import ClientFactoryClient from './ClientFactoryClient';

export const dynamic = 'force-dynamic';

export default async function ClientFactoryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return <AdminLogin />;
  }

  const presets = listClientFactoryPresets();

  return (
    <ClientFactoryClient
      storeConfigured={platformStoreConfigured()}
      presets={presets}
    />
  );
}
