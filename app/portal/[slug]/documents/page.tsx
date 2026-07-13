import Link from 'next/link';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';

export const dynamic = 'force-dynamic';

const STARTER_DOCUMENTS = [
  { title: 'Visibility Assessment Scorecard', href: '/scorecard', note: 'Download the lead magnet scorecard.' },
  { title: 'Operational MRI™', href: '/assessment', note: 'Start the capacity assessment funnel.' },
  { title: 'Simplifi capture guide', href: '/simplifi/capture', note: 'Capture URLs and images from phone or desktop.' },
];

export default async function DocumentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { client } = await requirePortalModule(slug, 'documents');

  return (
    <PortalSubpage
      slug={slug}
      active="documents"
      module="documents"
      kicker="{brand}"
      title="Your {brand} document hub"
      lede="Onboarding materials, assessments, and shared deliverables for {members} — starting with the essentials below."
    >
      <ul className="ep-module-list">
        {STARTER_DOCUMENTS.map((doc) => (
          <li key={doc.href} className="ep-module-card">
            <Link href={doc.href} className="ep-module-card-title">
              {doc.title}
            </Link>
            <p className="ep-module-card-note">{doc.note}</p>
          </li>
        ))}
        {client.packagePurchased && (
          <li className="ep-module-card">
            <p className="ep-module-card-title">Package: {client.packagePurchased}</p>
            <p className="ep-module-card-note">
              Paid {client.paymentDate ?? '—'} · Portal status {client.portalAccessStatus ?? 'Pending'}
            </p>
          </li>
        )}
      </ul>
    </PortalSubpage>
  );
}
