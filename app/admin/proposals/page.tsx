import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { getProposalsWithAssessments } from '@/lib/airtable';
import AdminLogin from './AdminLogin';
import ProposalsDashboard from './ProposalsDashboard';

export const dynamic = 'force-dynamic';

export default async function ProposalsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return <AdminLogin />;
  }

  const proposals = await getProposalsWithAssessments();
  return <ProposalsDashboard initialData={proposals} />;
}
