import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { getPartnerRecords } from '@/lib/airtable';
import { getMarketplaceListings, enrichWithPartners } from '@/lib/partner-marketplace';
import AdminLogin from '../master/AdminLogin';
import PartnerMarketplaceClient from './PartnerMarketplaceClient';

export const dynamic = 'force-dynamic';

export default async function PartnerMarketplacePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return <AdminLogin />;
  }

  const partners = await getPartnerRecords();
  const listings = enrichWithPartners(getMarketplaceListings(), partners);

  return <PartnerMarketplaceClient listings={listings} />;
}
