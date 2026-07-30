import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { loadCapabilityMarketplacePageData } from '@/lib/platform/marketplace-page-data';
import AdminLogin from '../master/AdminLogin';
import CapabilityMarketplaceClient from './CapabilityMarketplaceClient';

export const dynamic = 'force-dynamic';

export default async function CapabilityMarketplacePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return <AdminLogin />;
  }

  const data = loadCapabilityMarketplacePageData();

  return <CapabilityMarketplaceClient {...data} />;
}
