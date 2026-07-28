import Link from 'next/link';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { listPortalDocuments } from '@/lib/portal-document-hub';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { LegalStatusDashboard } from '@/app/components/trust/LegalStatusDashboard';
import { LegalJourneyStrip } from '@/app/components/trust/LegalJourneyStrip';
import { LegalAuditTimeline } from '@/app/components/trust/LegalAuditTimeline';
import { getClientLegalProfile, ensureDemoLegalClients } from '@/lib/trust-engine/client-store';
import { buildClientLegalStatus } from '@/lib/trust-engine/status';
import { buildLegalJourneyMilestones } from '@/lib/trust-engine/journey';
import { getLegalAuditHistory } from '@/lib/trust-engine/audit';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import { redirectCtpClientFromExecutiveSurface } from '@/lib/ctp-executive-surface-redirect';
import { CX_EMOTION } from '@/lib/ctp-emotional-copy';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await redirectCtpClientFromExecutiveSurface(slug, 'documents');
  const { client } = await requirePortalModule(slug, 'documents');
  const documents = await listPortalDocuments(slug, client);

  await ensureDemoLegalClients();
  const clientId = `portal_${slug}`;
  let profile = await getClientLegalProfile(clientId);
  if (!profile) {
    profile = await getClientLegalProfile('client_selena');
  }

  const productId = profile?.productId ?? 'portal_products';
  const legalStatus = buildClientLegalStatus({ productId, profile });

  let guideStage: import('@/lib/project-state-engine').GuideLifecycleStage | undefined;
  let paymentCompleted = false;
  try {
    const submission = await getCtpSubmissionForPortal({ portalSlug: slug });
    guideStage = submission?.guideStage;
    paymentCompleted = Boolean(submission?.projectEvidence?.flags?.['payment.completed']);
  } catch {
    // optional
  }

  const milestones = buildLegalJourneyMilestones({
    guideStage,
    profile,
    paymentCompleted,
    discoveryComplete: Boolean(
      // evidence may exist on submission — journey still renders without it
      false,
    ),
    proposalReady: false,
  });

  const audit = await getLegalAuditHistory({
    clientId: profile?.clientId,
    organizationId: profile?.organizationId,
    limit: 15,
  });

  return (
    <PortalSubpage
      slug={slug}
      active="documents"
      kicker="Documents"
      title={CX_EMOTION.documents.executiveTitle}
      lede={CX_EMOTION.documents.executiveLede}
    >
      <LegalJourneyStrip milestones={milestones} />

      <div style={{ marginBottom: '2.5rem' }}>
        <LegalStatusDashboard documents={legalStatus.documents} />
        <p className="ep-muted-link" style={{ marginTop: '1rem' }}>
          <Link href="/trust">Open Trust Center</Link>
          {' · '}
          <Link href="/legal/privacy">Privacy Policy</Link>
        </p>
      </div>

      <h2 className="ep-welcome-heading" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
        Files & deliverables
      </h2>
      <ul className="ep-module-list">
        {documents.map((doc) => (
          <li key={`${doc.source}:${doc.href}:${doc.title}`} className="ep-module-card">
            <Link
              href={doc.href}
              className="ep-module-card-title"
              {...(doc.external ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              {doc.title}
            </Link>
            <p className="ep-module-card-note">{doc.note}</p>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '2.5rem' }}>
        <LegalAuditTimeline events={audit} title="Recent legal activity" />
      </div>
    </PortalSubpage>
  );
}
