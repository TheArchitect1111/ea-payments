import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import { getProposalsWithAssessments } from '@/lib/airtable';
import { mapCtpAdminViewsByProposalId } from '@/lib/ctp-admin-view';
import { listCtpSubmissions } from '@/lib/ctp-submissions';
import ProposalsDashboard from './ProposalsDashboard';

export const dynamic = 'force-dynamic';

export default async function ProposalsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    redirectToAdminLogin('/admin/proposals');
  }

  const proposals = await getProposalsWithAssessments();
  const ctpByProposalId = mapCtpAdminViewsByProposalId(await listCtpSubmissions(200));
  return <ProposalsDashboard initialData={proposals} ctpByProposalId={ctpByProposalId} />;
}
