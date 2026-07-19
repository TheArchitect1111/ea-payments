import { redirect } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalShell } from '@/lib/chassis/PortalShell';
import ClientExperience from '@/app/portal/components/ClientExperience';
import PortalCtpAssetGallery from '@/app/portal/components/PortalCtpAssetGallery';
import PortalCtpDesignStudioForm from '@/app/portal/components/PortalCtpDesignStudioForm';
import { buildCtpOpportunityDashboardView } from '@/lib/ctp-opportunity-view';
import { buildCtpPortalStatusView } from '@/lib/ctp-portal-status';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import '../ea-portal.css';

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
  const statusView = buildCtpPortalStatusView(submission);
  const discovery = (submission.discoveryAnswers ?? {}) as Record<string, unknown>;

  const studio = (
    <>
      <PortalCtpDesignStudioForm
        slug={slug}
        experienceMode
        designStudio={statusView.designStudio}
        studioStatus={statusView.studioStatus}
        initial={{
          brand_colors: typeof discovery.brand_colors === 'string' ? discovery.brand_colors : undefined,
          brand_fonts: typeof discovery.brand_fonts === 'string' ? discovery.brand_fonts : undefined,
          brand_voice: typeof discovery.brand_voice === 'string' ? discovery.brand_voice : undefined,
          competitors: typeof discovery.competitors === 'string' ? discovery.competitors : undefined,
          inspiration: typeof discovery.inspiration === 'string' ? discovery.inspiration : undefined,
          offer_summary:
            typeof discovery.offer_summary === 'string' ? discovery.offer_summary : undefined,
        }}
      />
      <PortalCtpAssetGallery assets={statusView.assets} experienceMode />
    </>
  );

  return (
    <PortalShell slug={slug} active="ctp" presentation="experience" firstName={firstName}>
      <ClientExperience view={view} slug={slug} studio={studio} />
    </PortalShell>
  );
}
