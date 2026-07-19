import { redirect } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import OpportunityDashboard from '@/app/portal/components/OpportunityDashboard';
import PortalCtpAssetGallery from '@/app/portal/components/PortalCtpAssetGallery';
import PortalCtpDesignStudioForm from '@/app/portal/components/PortalCtpDesignStudioForm';
import { buildCtpOpportunityDashboardView } from '@/lib/ctp-opportunity-view';
import { buildCtpPortalStatusView } from '@/lib/ctp-portal-status';
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
  const statusView = buildCtpPortalStatusView(submission);
  const discovery = (submission.discoveryAnswers ?? {}) as Record<string, unknown>;

  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      kicker="Your Personalized Portal"
      title={`Welcome, ${firstName}`}
      lede="What happens next - and how we build this together."
    >
      <OpportunityDashboard view={view} />

      <div className="ep-module-card" style={{ marginBottom: '1.25rem' }} id="continue-conversation">
        <p className="ep-module-card-note" style={{ marginBottom: '0.5rem' }}>
          Continue the Conversation
        </p>
        <p style={{ margin: '0 0 1rem', fontSize: '0.95rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.78)' }}>
          Tell us more about your organization, goals, and challenges. Upload logo, brand guide,
          photos, and current materials. Everything saves into your workspace.
        </p>
        <PortalCtpDesignStudioForm
          slug={slug}
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
      </div>

      <PortalCtpAssetGallery assets={statusView.assets} />
    </PortalSubpage>
  );
}