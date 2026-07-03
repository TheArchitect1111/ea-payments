import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import CampaignDashboardClient from './CampaignDashboardClient';

export const dynamic = 'force-dynamic';

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) redirectToAdminLogin('/admin/creative-studio');

  const { id } = await params;
  return <CampaignDashboardClient campaignId={id} />;
}
