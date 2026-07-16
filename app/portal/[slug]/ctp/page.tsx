import { redirect } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import OpportunityDashboard from '@/app/portal/components/OpportunityDashboard';
import { buildCtpOpportunityDashboardView } from '@/lib/ctp-opportunity-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
export const dynamic = 'force-dynamic';

export default async function PortalCtpOpportunityDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { session, client } = await requirePortalModule(slug, 'ctp');

  const submission = await getCtpSubmissionForPortal({
    portalSlug: slug,
    email: session.email ?? client.email,
  });

  if (!submission) {
    redirect(`/portal/${slug}`);
  }

  const firstName = (client.clientName || submission.contactName).split(' ')[0];
  const view = buildCtpOpportunityDashboardView(submission, slug, { firstName });

  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      kicker="Opportunity Experience™"
      title="Opportunity Dashboard"
      lede={`What Efficiency Architects discovered about ${view.businessName}.`}
    >
      <OpportunityDashboard view={view} />
    </PortalSubpage>
  );
}
