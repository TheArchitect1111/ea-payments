import { redirect } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalShell } from '@/lib/chassis/PortalShell';
import OpportunityReviewExperience from '@/app/portal/components/OpportunityReviewExperience';
import { buildCtpOpportunityReviewView } from '@/lib/ctp-opportunity-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';

export const dynamic = 'force-dynamic';

export default async function PortalCtpOpportunityReviewPage({
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
  const view = buildCtpOpportunityReviewView(submission, slug, { firstName });

  return (
    <PortalShell slug={slug} active="ctp" presentation="experience" firstName={firstName}>
      <OpportunityReviewExperience view={view} />
    </PortalShell>
  );
}
